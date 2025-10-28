// =========================================
// Hungrai Prompt Orchestrator (Cart-aware version)
// Model: GPT-4.1-mini
// With Response Evaluation Pipeline
// =========================================

const OpenAI = require("openai");

// Initialize OpenAI client only when needed
let openai = null;

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

/**
 * Evaluates an LLM response for quality and appropriateness
 * @param {Object} params - Evaluation parameters
 * @param {Object} params.restaurant - Restaurant info
 * @param {Array} params.history - Conversation history
 * @param {Array} params.cart - Current cart
 * @param {Object} params.response - LLM response to evaluate
 * @returns {Promise<Object>} - Evaluation results with pass/fail and feedback
 */
// Conversation state machine to better track context
const conversationStates = {
  GREETING: 'greeting',
  MENU_EXPLORATION: 'menu_exploration',
  ITEM_SELECTION: 'item_selection',
  CART_REVIEW: 'cart_review',
  CHECKOUT_CONFIRMATION: 'checkout_confirmation',
  ORDER_CONFIRMED: 'order_confirmed',
  ERROR_RECOVERY: 'error_recovery'
};

// Conversation state tracker
const conversationTracker = {
  currentState: conversationStates.GREETING,
  history: [],
  
  // Transition to a new state
  transition(newState, reason) {
    this.history.push({
      from: this.currentState,
      to: newState,
      reason,
      timestamp: new Date().toISOString()
    });
    this.currentState = newState;
    console.log(`🔄 State transition: ${this.history[this.history.length-1].from} -> ${newState} (${reason})`);
  },
  
  // Predict next state based on context
  predictNextState(userMessage, assistantMessage, cart) {
    // Basic state prediction logic
    if (this.currentState === conversationStates.GREETING && userMessage.toLowerCase().includes('menu')) {
      return conversationStates.MENU_EXPLORATION;
    }
    
    if (assistantMessage.toLowerCase().includes('checkout') && 
        (userMessage.toLowerCase().includes('yes') || userMessage.toLowerCase().includes('sure'))) {
      return conversationStates.CHECKOUT_CONFIRMATION;
    }
    
    if (userMessage.toLowerCase().match(/^(no|nope)$/i) && 
        assistantMessage.toLowerCase().includes('add more')) {
      return conversationStates.CART_REVIEW;
    }
    
    // Keep current state as default
    return this.currentState;
  },
  
  // Get context information for current state
  getContextForState() {
    switch(this.currentState) {
      case conversationStates.CHECKOUT_CONFIRMATION:
        return "User is confirming checkout. DO NOT add items again. Use intent='confirm'.";
      case conversationStates.CART_REVIEW:
        return "User is reviewing their cart. Focus on order details and checkout options.";
      default:
        return "";
    }
  }
};

// In-memory store for learning from past evaluations
// This would ideally be a persistent database in production
const learningStore = {
  evaluationHistory: [],
  commonErrors: {},
  addEvaluation(evaluation) {
    this.evaluationHistory.push(evaluation);
    if (this.evaluationHistory.length > 100) this.evaluationHistory.shift(); // Keep last 100
    
    // Track common error patterns
    if (!evaluation.pass) {
      const errorType = this.categorizeError(evaluation.feedback);
      this.commonErrors[errorType] = (this.commonErrors[errorType] || 0) + 1;
    }
  },
  categorizeError(feedback) {
    // Simple error categorization
    if (feedback.includes('menu')) return 'MENU_ERROR';
    if (feedback.includes('cart')) return 'CART_AWARENESS';
    if (feedback.includes('relevance')) return 'RELEVANCE';
    return 'OTHER';
  },
  getMostCommonErrors() {
    return Object.entries(this.commonErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
  },
  getSelfImprovementPrompt() {
    const topErrors = this.getMostCommonErrors();
    if (topErrors.length === 0) return '';
    
    return `SELF-IMPROVEMENT FOCUS: You've been making these common errors:
      ${topErrors.join(', ')}. Pay special attention to avoiding these issues.`;
  }
};

async function evaluateLLMResponse({ restaurant, history, cart, response }) {
  // Create evaluation prompt
  const menuSnippet = restaurant.menu
    .map(m => `${m.title} — Rs.${m.price.toLocaleString()} (${m.tags.join(", ")})`)
    .join("\n");

  const cartSummary = cart.length > 0
    ? cart.map(i => `${i.title} (Rs.${i.price.toLocaleString()})`).join(", ")
    : "No items yet.";

  // Get available categories from menu
  const availableCategories = new Set();
  restaurant.menu.forEach(item => {
    item.tags.forEach(tag => availableCategories.add(tag));
  });
  const categoryList = Array.from(availableCategories).join(", ");

  // Last 2 user messages for context
  const lastUserMessages = history
    .filter(msg => msg.role === "user")
    .slice(-2)
    .map(msg => msg.content);

  // Last assistant message for context
  const lastAssistantMessage = history
    .filter(msg => msg.role === "assistant")
    .slice(-1)
    .map(msg => msg.content)[0] || "";
  
  // Check if this is likely a checkout confirmation scenario
  const isCheckoutConfirmationContext = 
    lastAssistantMessage?.includes("checkout") && 
    lastUserMessages?.some(msg => /^(yes|sure|ok|yeah|proceed|confirm)$/i.test(msg.trim()));
  
  // Check if user recently declined adding more items
  const isNoMoreItemsContext =
    lastAssistantMessage?.includes("add") &&
    lastUserMessages?.some(msg => /^(no|nope|that's it|that is it)$/i.test(msg.trim()));

  const evaluationPrompt = `
You are a strict quality evaluator for restaurant AI responses. Evaluate if the response meets all criteria:

### CONTEXT:
- User's recent messages: ${JSON.stringify(lastUserMessages)}
- Previous assistant message: "${lastAssistantMessage}"
- Current cart: ${cartSummary}
- Available menu items: ${menuSnippet}
- Available categories: ${categoryList}
- Is checkout confirmation context: ${isCheckoutConfirmationContext}
- Is "no more items" context: ${isNoMoreItemsContext}
- NOTE: This restaurant DOES NOT serve drinks or any items not explicitly listed in the menu.

### RESPONSE TO EVALUATE:
${response.reply_text}

### EVALUATION CRITERIA:
1. MENU ACCURACY: Response MUST NOT mention or suggest any items that aren't on the menu
2. CATEGORY ACCURACY: Response MUST NOT suggest categories (like drinks) that don't exist
3. RELEVANCE: Response must directly address the user's query or intent
4. CART AWARENESS: Response must acknowledge current cart items when appropriate
5. CLARITY: Response must be clear about menu items, prices, and suggestions
6. ACTIONABILITY: User must be able to easily understand what to do next
7. FORMAT: Response must be well-formatted text only, no JSON artifacts or evaluation text
8. CHECKOUT HANDLING: If user confirmed checkout, response should proceed to checkout, NOT add items again
9. INTENT ACCURACY: "yes" after asking about checkout should be interpreted as "confirm", not "add_to_cart"
10. DUPLICATE PREVENTION: NEVER add the same items to the cart multiple times

### STRICT RULES:
- If response suggests non-existent items or categories (like drinks), it MUST fail
- If response is showing evaluation information to the end user, it MUST fail
- If response doesn't directly answer the user's question, it MUST fail
- If response contains JSON artifacts or technical data, it MUST fail
- If response says "cart is empty" when cart has items, it MUST fail (CRITICAL ERROR)
- If response doesn't acknowledge actual cart items during checkout, it MUST fail

### EVALUATION:
Analyze the response against these criteria and provide:
1. PASS (true/false): Whether the response meets all criteria
2. FEEDBACK: If failed, explain why and what needs improvement
3. SUGGESTION: If failed, suggest a fully corrected response that fixes ALL issues

Return your evaluation as a JSON object ONLY:
`;

  try {
    // Include self-improvement prompt based on learning history
    const selfImprovementPrompt = learningStore.getSelfImprovementPrompt();
    const enhancedEvalPrompt = evaluationPrompt + 
      (selfImprovementPrompt ? `\n\n${selfImprovementPrompt}` : '');
    
    const evalResponse = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini", // Use a smaller/faster model for evaluation
      messages: [
        { role: "system", content: enhancedEvalPrompt },
        { role: "user", content: JSON.stringify(response) }
      ],
      max_tokens: 500,
      temperature: 0.2, // Keep temperature low for consistent evaluations
    });

    const rawEval = evalResponse.choices[0].message.content.trim();
    
    try {
      // Try to parse the evaluation as JSON
      const parsed = JSON.parse(rawEval);
      const result = {
        pass: !!parsed.PASS, // Convert to boolean
        feedback: parsed.FEEDBACK || "No specific feedback provided",
        suggestion: parsed.SUGGESTION || null,
        timestamp: new Date().toISOString()
      };
      
      // Add to learning store
      learningStore.addEvaluation(result);
      return result;
    } catch (parseErr) {
      // If not valid JSON, do text-based analysis
      const passMatch = rawEval.match(/PASS[^\w]*(true|false)/i);
      const pass = passMatch ? passMatch[1].toLowerCase() === "true" : false;
      
      const result = {
        pass,
        feedback: "Error parsing evaluation: " + parseErr.message,
        rawEvaluation: rawEval,
        timestamp: new Date().toISOString()
      };
      
      // Even failed parses should contribute to learning
      learningStore.addEvaluation(result);
      return result;
    }
  } catch (err) {
    console.error("Evaluation error:", err.message);
    // If evaluation fails, pass the original response to avoid blocking
    return { pass: true, feedback: "Evaluation error: " + err.message };
  }
}

/**
 * Builds prompt for GPT-4.1-mini, sending chat history, current cart,
 * and menu context to guide conversational ordering flow.
 */
async function buildPromptAndCallLLM({ restaurant, history, cart = [] }) {
  // prepare menu for context
  const menuSnippet = restaurant.menu
    .map(
      (m) =>
        `${m.title} — Rs.${m.price.toLocaleString()} (${m.tags.join(", ")})`
    )
    .join("\n");

  // identify low-selling item if available
  const lowSelling =
    restaurant.menu.find((i) => i.tags.includes("low_selling")) ||
    restaurant.menu[Math.floor(Math.random() * restaurant.menu.length)];

  // create readable cart summary with quantities
  const cartSummary =
    cart.length > 0
      ? cart.map((i) => `${i.qty}x ${i.title} (Rs.${i.price.toLocaleString()} each)`).join(", ")
      : "No items yet.";
  
  const cartTotal = cart.reduce((sum, item) => sum + (item.qty * item.price), 0);

  const systemPrompt = `
You are **Hungrai**, an AI waiter for "${restaurant.name}".
You take orders conversationally like a friendly human waiter.

💡 OBJECTIVE:
Help the customer build their order step-by-step.
Keep a running cart and encourage them to add sides or other available menu items.

🧠 CART AWARENESS - CRITICAL:
Current cart contents: ${cartSummary}
Current cart total: Rs.${cartTotal.toLocaleString()}
⚠️ When user asks about their cart, use THESE EXACT quantities and items above.
⚠️ Do NOT add items if user is just asking about or clarifying their existing order.

🧠 SELF-EVOLUTION CAPABILITIES:
- You maintain PERFECT CART AWARENESS between messages
- You learn from previous interactions to improve your responses
- When asked about the current cart or total, ALWAYS refer to the EXACT items already added
- You adapt your communication style based on customer preferences

⚠️ CRITICAL CONTEXT AWARENESS:
- When you ask "Would you like to proceed/continue to checkout?" and user says "yes/sure/ok", set intent = "confirm"
- When you ask "Would you like to add anything else?" and user says "no/nope", set intent = "confirm"
- When you suggest an item and user says "yes/sure/ok", set intent = "add_to_cart"
- NEVER add items again if they're already in the cart - check cart first!
- If the cart already has items and user confirms checkout, DO NOT add items again!

🎯 RULES:
1. Greet only once per session. Avoid repeating "Welcome" each time.
2. When the user asks for the menu or specials:
   - Clearly list all menu items in bullet points with emojis and prices in Rs.
3. If the user asks "what's best" or "what do you recommend":
   - Recommend ONE bestseller or low_selling item.
   - Tag your reply as intent = "add_to_cart" since user might confirm it next.
4. If the user names an item or agrees with your suggestion (yes/sure/ok/add it):
   - Add that item to their cart, update the cart summary, and respond naturally.
   - ⚠️ ABSOLUTE RULE: In orderItems JSON, include ONLY items user JUST requested in THIS message
   - Example: User says "2 fries only" → orderItems: [{"title":"Loaded Fries","qty":2}] NOTHING ELSE
   - ⚠️ CRITICAL: If user says "I ordered X items" or "I wanted X items", they are CLARIFYING, NOT ORDERING AGAIN
   - Do NOT add items if user is asking "what's in my cart" or stating what they already ordered
5. After each addition, mention what's in their cart so far:
   - Example: "You now have a Truffle Melt Burger. Want to add something else?"
6. When asked about cart contents or quantity:
   - Report EXACT quantities from the current cart
   - Use the cart data provided, don't make up numbers
7. Occasionally upsell by suggesting another menu item, like:
   - "People often pair that with our ${lowSelling.title}!"
8. Only when the user says things like *confirm*, *checkout*, or *done*, finalize the order.
   Until then, just keep adding items to their cart.
9. Always keep the tone warm, polite, and concise.
10. ⚠️ CRITICAL: NEVER suggest or mention drinks or any items not explicitly listed in the menu below.
11. If a customer asks about drinks or items not on the menu, politely inform them we don't have those items.
12. ALWAYS stick to suggesting ONLY the exact items listed below - never make up menu items.

🧾 Current cart: ${cartSummary}
💰 Cart total: Rs.${cartTotal.toLocaleString()}
🍽️ Menu:
${menuSnippet}

🧠 Expected Output JSON:
{
  "reply_text": "<your friendly natural reply>",
  "intent": "<one of: info, add_to_cart, upsell, confirm, unknown>",
  "orderItems": [ { "title": "Item Name", "qty": 1, "price": 1234 } ],
  "totalEstimate": 0
}
`;


  // Check the previous intent and message to provide better context
  const lastAssistantMessage = history
    .filter(msg => msg.role === "assistant")
    .pop();
  
  // Extract intent from previous assistant message if available
  const previousIntent = lastAssistantMessage && 
    typeof lastAssistantMessage.content === "string" &&
    lastAssistantMessage.content.includes("checkout") 
      ? "checkout_question" 
      : "unknown";
  
  // Update conversation state based on history
  const lastUserMessage = history.filter(msg => msg.role === "user").pop()?.content || "";
  
  // Check for direct checkout request
  if (lastUserMessage.toLowerCase().includes("checkout")) {
    conversationTracker.transition(conversationStates.CHECKOUT_CONFIRMATION, "Direct checkout request");
  } else {
    const nextState = conversationTracker.predictNextState(
      lastUserMessage, 
      lastAssistantMessage?.content || "", 
      cart
    );
    conversationTracker.transition(nextState, "Context analysis");
  }
  
  // Add state context to help model understand the conversation flow
  const stateContextMessage = {
    role: "system",
    content: `CONVERSATION STATE: ${conversationTracker.currentState}
      ${conversationTracker.getContextForState()}
      
      Previous assistant intent: ${previousIntent}. 
      If previous intent was "checkout_question" and user says "yes", 
      your intent should be "confirm" NOT "add_to_cart".
      If user previously said "nope" or "no" to adding more items,
      your intent should be "confirm" when they next say "yes".
      
      CRITICAL: If checkout was mentioned and user says "yes", DO NOT add items again to cart.
      Current state indicates: ${
        conversationTracker.currentState === conversationStates.CHECKOUT_CONFIRMATION ? 
        "CHECKOUT - DO NOT ADD ITEMS AGAIN" : 
        "Normal conversation flow"
      }`
  };
  
  // Compose messages with history
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10),
    stateContextMessage,
  ];

  try {
    // Maximum number of retry attempts - reduced for serverless timeout limits
    const MAX_RETRIES = 2;
    let attempts = 0;
    let finalResponse = null;
    let evaluationResult = null;
    
    // Skip evaluation in production to avoid timeouts
    const SKIP_EVALUATION = process.env.SKIP_EVALUATION === 'true' || process.env.NODE_ENV === 'production';

    // Add explicit cart state reminder with extreme emphasis to ensure awareness across interactions
    messages.push({
      role: "system",
      content: `⚠️ CRITICAL CART STATE ⚠️: 
      Cart contains EXACTLY ${cart.length} items: ${
        cart.length > 0 
          ? cart.map(item => `${item.title} (Rs.${item.price})`).join(", ")
          : "Empty cart"
      }. Total so far: Rs.${cart.reduce((sum, item) => sum + item.price, 0)}. 
      
      ‼️ ABSOLUTE REQUIREMENT: Your response MUST acknowledge these EXACT items in cart.
      ‼️ If cart has items, NEVER say "cart is empty" - this will be considered a critical error.
      ‼️ When user asks to "checkout", you MUST confirm with items actually in cart.
      ‼️ When user asks what's in cart, repeat EXACTLY these items with prices.
      
      🔒 CART VALIDATION: Before responding about cart contents or checkout, verify your response matches the cart data above.`
    });
    
    // Feedback loop - keep trying until we get a satisfactory response or hit max retries
    while (attempts < MAX_RETRIES) {
      attempts++;
      
      // Add any feedback from previous failed attempts
      const adjustedMessages = [...messages];
      if (evaluationResult && !evaluationResult.pass && attempts > 1) {
        adjustedMessages.push({
          role: "system",
          content: `IMPROVEMENT NEEDED: ${evaluationResult.feedback}\n\nPlease fix these issues in your next response.`
        });
      }
      
      // Call LLM with possibly adjusted messages
      const resp = await getOpenAIClient().chat.completions.create({
        model: "gpt-4.1-mini",
        messages: adjustedMessages,
        max_tokens: 600,
        temperature: 0.7 + (attempts * 0.1), // Slightly increase temperature with each retry for variation
      });

      const raw = resp.choices?.[0]?.message?.content?.trim() || "";

      try {
        // Parse response
        const parsed = JSON.parse(raw);
        if (!parsed.reply_text) parsed.reply_text = raw;
        finalResponse = parsed;
        
        // Evaluate the response (skip in production to avoid timeouts)
        if (!SKIP_EVALUATION) {
          evaluationResult = await evaluateLLMResponse({ 
            restaurant, 
            history, 
            cart, 
            response: finalResponse 
          });
          
          // Log evaluation result
          console.log(`Response evaluation (attempt ${attempts}):`, 
            { pass: evaluationResult.pass, feedback: evaluationResult.feedback });
          
          // If the response passes evaluation, we're done
          if (evaluationResult.pass) {
            break;
          } else {
            console.log(`Retry attempt ${attempts}/${MAX_RETRIES}: Response failed evaluation`);
          }
        } else {
          // In production, skip evaluation and accept the response
          evaluationResult = { pass: true, attempts: 1, feedback: 'Evaluation skipped in production' };
          break;
        }
      } catch (parseErr) {
        // If we can't parse the response as JSON, use raw text as fallback
        finalResponse = { reply_text: raw, intent: "unknown" };
        
        // Evaluate even unparseable responses (skip in production)
        if (!SKIP_EVALUATION) {
          evaluationResult = await evaluateLLMResponse({
            restaurant,
            history,
            cart,
            response: finalResponse
          });
          
          // If it somehow passes evaluation despite parse error, accept it
          if (evaluationResult.pass) {
            break;
          }
        } else {
          // In production, accept unparseable responses without evaluation
          evaluationResult = { pass: true, attempts: 1, feedback: 'Parse error, evaluation skipped' };
          break;
        }
      }
    }
    
    // Track successful patterns to learn from them
    const trackSuccessfulPattern = (response) => {
      if (!response) return;
      
      // Only learn from high-quality responses that passed evaluation
      if (evaluationResult?.pass) {
        // Store this as a successful pattern
        const successPattern = {
          intent: response.intent || "unknown",
          cartState: cart.length,
          userQuery: history.length > 0 ? history[history.length - 1].content : "",
          successfulResponse: response.reply_text,
          timestamp: new Date().toISOString()
        };
        
        // In a real implementation, you would store this to a database
        // For now, we'll log it to show the learning process
        console.log("🧠 Learning from successful pattern:", successPattern);
        
        // In a production system, you would use this data to train a model
        // that suggests improved responses based on past successes
      }
    };
    
    // Add evaluation metadata to the response
    if (finalResponse) {
      // Track this response if it passed evaluation
      trackSuccessfulPattern(finalResponse);
      
      // Use _evaluation with underscore to mark internal-only field
      finalResponse._evaluation = {
        passes: evaluationResult?.pass || false,
        attempts,
        feedback: evaluationResult?.feedback || "No evaluation feedback"
      };
      
      // If we have a suggestion and response didn't pass, USE it to replace
      // This is critical to prevent bad responses from reaching users
      if (!evaluationResult?.pass && evaluationResult?.suggestion) {
        console.log("Using evaluator suggestion:", evaluationResult.suggestion);
        finalResponse._originalReply = finalResponse.reply_text; // save for debugging
        finalResponse.reply_text = evaluationResult.suggestion;
      }
      
      // Enhanced checkout and cart validation
      // Handle checkout confirmation and cart verification
      if (finalResponse.intent === "confirm" || 
          conversationTracker.currentState === conversationStates.CHECKOUT_CONFIRMATION ||
          lastUserMessage.toLowerCase().includes("checkout")) {
        
        console.log("🛒 Cart validation during checkout:", cart);
        
        // Check if response incorrectly states the cart is empty when it isn't
        if (cart.length > 0 && 
            finalResponse.reply_text.toLowerCase().includes("cart is empty")) {
          console.log("⚠️ CRITICAL ERROR: Response says cart is empty when it has items!");
          
          // Force correct response with actual cart items
          finalResponse.reply_text = 
            `Great! I'll process your order for ${cartSummary}. The total is Rs.${
              cart.reduce((sum, item) => sum + item.price, 0)
            }. Your order will be confirmed shortly. Thank you for ordering with us!`;
          
          // Ensure intent and order items match actual cart
          finalResponse.intent = "confirm";
          finalResponse.orderItems = [...cart]; // Copy current cart items
          finalResponse._cartError = "Fixed incorrect empty cart response";
        }
        
        // Prevent duplicate item additions during checkout
        if (conversationTracker.currentState === conversationStates.CHECKOUT_CONFIRMATION &&
            finalResponse.intent === "add_to_cart") {
          console.log("⚠️ Prevented duplicate item addition during checkout!");
          // Force the correct intent
          finalResponse.intent = "confirm";
          // Clear any items that might have been added (they're already in the cart)
          finalResponse.orderItems = [];
          // Make sure response focuses on checkout
          if (!finalResponse.reply_text.toLowerCase().includes("checkout")) {
            finalResponse.reply_text = 
              `Great! I'll proceed with your order for ${cartSummary}. The total is Rs.${
                cart.reduce((sum, item) => sum + item.price, 0)
              }. Your order will be ready shortly. Thank you for ordering with us!`;
          }
        }
      }
      
      // Thorough cleaning to ensure no evaluation text reaches users
      finalResponse.reply_text = finalResponse.reply_text
        // Remove JSON artifacts
        .replace(/\s*\{[\s\S]*\}\s*$/, "")
        // Remove evaluation suggestions - complete line
        .replace(/An improved response could be[:'].*$/img, "")
        // Remove evaluation explanations
        .replace(/This (acknowledges|addresses|handles|fixes|resolves).*$/img, "")
        // Remove any remaining evaluation headers
        .replace(/^This response (fails|passes).*(?=\n)/img, "")
        .replace(/^PASS.*(?=\n)/img, "")
        .replace(/^FEEDBACK.*(?=\n)/img, "")
        .replace(/^SUGGESTION.*(?=\n)/img, "")
        .trim();
      
      // Final safety checks
      
      // Check for evaluation text leakage
      if (
        finalResponse.reply_text.match(/improved response|evaluation|PASS[:=]|FEEDBACK[:=]|SUGGESTION[:=]/i) ||
        finalResponse.reply_text.includes("This response")
      ) {
        console.log("⚠️ Detected evaluation text in cleaned response! Using fallback reply.");
        // Use a generic safe response instead
        finalResponse.reply_text = "I'd be happy to help with your order from our menu. What would you like today?";
      }
      
      // Critical cart state validation - prevent "cart is empty" when it's not
      if (cart.length > 0 && finalResponse.reply_text.toLowerCase().includes("cart is empty")) {
        console.log("🚨 CRITICAL: Response incorrectly says cart is empty! Fixing...");
        
        // Use fallback that correctly references cart
        const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
        const itemNames = cart.map(item => item.title).join(", ");
        
        if (lastUserMessage.toLowerCase().includes("checkout")) {
          finalResponse.reply_text = `Great! I'm processing your order for ${itemNames}. Your total is Rs.${cartTotal}. Your order will be ready shortly!`;
          finalResponse.intent = "confirm";
        } else {
          finalResponse.reply_text = `Your cart currently contains ${itemNames}, for a total of Rs.${cartTotal}. Would you like to add anything else or proceed to checkout?`;
        }
      }
    }
    
    return finalResponse || {
      reply_text: "I'm having trouble generating a good response. Let me try again. What would you like to order?",
      intent: "error",
      _evaluation: { passes: false, attempts, feedback: "Failed after max retries" }
    };
  } catch (err) {
    console.error("LLM error:", err.message);
    // Properly use _evaluation (not evaluation) to prevent leaking to frontend
    return {
      reply_text:
        "⚠️ Sorry, something went wrong while fetching the menu. Please try again.",
      intent: "error",
      _evaluation: { passes: false, error: err.message }
    };
  }
}

// Method to export learning data for analysis/training
const getLearningInsights = () => {
  return {
    evaluationHistory: learningStore.evaluationHistory,
    commonErrors: learningStore.commonErrors,
    errorDistribution: Object.entries(learningStore.commonErrors).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / learningStore.evaluationHistory.length) * 100)
    })),
    totalEvaluations: learningStore.evaluationHistory.length,
    passRate: learningStore.evaluationHistory.filter(e => e.pass).length / 
              Math.max(1, learningStore.evaluationHistory.length)
  };
};

/**
 * Extract menu items from user message using GPT
 * @param {string} userMessage - User's message
 * @param {Array} menu - Restaurant menu items
 * @returns {Promise<Object>} - Extracted items with quantities
 */
async function extractMenuItems(userMessage, menu) {
  try {
    const menuItems = menu.map(item => `${item.name} - $${item.price}`).join('\n');
    
    const prompt = `
Extract food items and quantities from this customer message.

MENU ITEMS:
${menuItems}

CUSTOMER MESSAGE: "${userMessage}"

Return a JSON object with this structure:
{
  "items": [
    {
      "name": "exact menu item name",
      "quantity": number
    }
  ]
}

Rules:
- Only include items that exist in the menu
- Use exact menu item names
- If no quantity specified, assume 1
- If no valid items found, return empty items array
`;

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 300
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;

  } catch (error) {
    console.error('Error extracting menu items:', error);
    return { items: [] };
  }
}

/**
 * Generate contextual response using GPT
 * @param {Object} context - Context including restaurant, menu, cart, user message
 * @returns {Promise<string>} - Generated response
 */
async function generateResponse(context) {
  try {
    const { restaurant, menu, cart, userMessage } = context;
    
    const menuText = menu.map(item => `${item.name} - $${item.price}`).join('\n');
    const cartText = cart.items?.length > 0 
      ? cart.items.map(item => `${item.quantity}x ${item.name}`).join(', ')
      : 'empty';

    const prompt = `
You are a helpful assistant for ${restaurant}. Help the customer with their order.

MENU:
${menuText}

CURRENT CART: ${cartText}

CUSTOMER MESSAGE: "${userMessage}"

Provide a helpful, friendly response that:
- Answers their question about the menu or restaurant
- Suggests relevant menu items if appropriate
- Keeps responses concise (under 100 words)
- Uses emojis sparingly for friendliness

Do not make up menu items or prices that aren't listed above.
`;

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error('Error generating response:', error);
    return "I'm having trouble right now. Please try asking about our menu or placing an order!";
  }
}

class PromptOrchestrator {
  async extractMenuItems(userMessage, menu) {
    return extractMenuItems(userMessage, menu);
  }

  async generateResponse(context) {
    return generateResponse(context);
  }

  async buildPromptAndCallLLM(...args) {
    return buildPromptAndCallLLM(...args);
  }
}

module.exports = { 
  buildPromptAndCallLLM,
  evaluateLLMResponse,
  getLearningInsights,
  conversationStates,
  getConversationState: () => conversationTracker.currentState,
  extractMenuItems,
  generateResponse,
  PromptOrchestrator
};
