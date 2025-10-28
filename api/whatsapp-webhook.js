// WhatsApp Cloud API Webhook handler - Complete Implementation
// Handles verification (GET) and incoming messages (POST)
// Uses environment variables: WHATSAPP_VERIFY_TOKEN, WHATSAPP_ACCESS_TOKEN
// Build instrumentation added for deployment verification.

const BUILD_VERSION = 'v2025-10-28-1';
const TOKEN_TAIL = process.env.WHATSAPP_ACCESS_TOKEN ? process.env.WHATSAPP_ACCESS_TOKEN.slice(-8) : 'NO_TOKEN';
console.log(`[BOOT] whatsapp-webhook starting build=${BUILD_VERSION} tokenTail=****${TOKEN_TAIL}`);

const { connectDB } = require('./dbConnection');
const WhatsAppMessenger = require('./whatsappMessenger');
const WhatsAppSessionManager = require('./whatsappSessionManager');
const RestaurantLookup = require('./restaurantLookup');
const { classifyMessage } = require('./intentRouter');

const messenger = new WhatsAppMessenger();
const sessionManager = new WhatsAppSessionManager();

// Normalize inbound WhatsApp message structure
function normalizeMessage(entry) {
  try {
    const changes = entry.changes || [];
    for (const change of changes) {
      const value = change.value || {};
      const messages = value.messages || [];
      if (!messages.length) continue;
      return messages.map(m => ({
        from: m.from,
        id: m.id,
        timestamp: m.timestamp,
        type: m.type,
        text: m.text?.body || '',
        raw: m,
        whatsappBusinessAccountId: value.metadata?.display_phone_number,
        phoneNumberId: value.metadata?.phone_number_id
      }));
    }
  } catch (e) {
    console.error('[WHATSAPP] normalize error', e.message);
  }
  return [];
}

/**
 * Process user message through intent routing and business logic
 */
async function processUserMessage(message, restaurant) {
  const { from, text, phoneNumberId } = message;
  const restaurantSlug = restaurant.slug;

  try {
    // Get user session
    const session = await sessionManager.getSession(restaurantSlug, from);
    
    // Route message through intent system
    const routing = await classifyMessage({ text, restaurant });

    console.log('🎯 Message routing:', routing);

    // Normalize routing labels from classifier: fast | dialogflow | llm | ignore
    switch (routing.route) {
      case 'fast':
        await handleFastPathResponse(from, routing.intent, restaurant);
        break;

      case 'dialogflow':
        await handleDialogflowResponse(from, text, restaurant, routing.dialogflowResponse);
        break;

      case 'llm':
        await handleGPTFallback(from, text, restaurant, session);
        break;

      case 'ignore':
        console.log('🪻 Ignoring empty message');
        break;

      default:
        console.warn('⚠️ Unknown routing route received:', routing);
        await messenger.sendTextMessage(from, "I'm not sure how to help with that. Can you try rephrasing?");
    }

    // Update user session activity
    await sessionManager.updateSession(restaurantSlug, from, {
      lastMessage: text,
      lastIntent: routing.intent || 'unknown'
    });

  } catch (error) {
    console.error('Error processing user message:', error);
    await messenger.sendTextMessage(from, "Sorry, I'm having trouble right now. Please try again in a moment.");
  }
}

/**
 * Handle fast-path responses for common queries
 */
async function handleFastPathResponse(userNumber, intent, restaurant) {
  switch (intent) {
    case 'greeting':
      await messenger.sendTextMessage(
        userNumber,
        `Welcome to ${restaurant.name}! 👋\n\nI can help you:\n• View our menu\n• Place an order\n• Track your order\n\nJust tell me what you'd like to do!`
      );
      break;
    case 'show_menu':
      const menu = await RestaurantLookup.getRestaurantMenu(restaurant);
      if (menu.length > 0) {
        await messenger.sendMenuMessage(
          userNumber,
          `🍽️ ${restaurant.name} Menu`,
          menu
        );
      } else {
        await messenger.sendTextMessage(
          userNumber,
          "Our menu is being updated. Please check back soon!"
        );
      }
      break;

    case 'help':
      await messenger.sendTextMessage(userNumber, "You can ask for 'menu', 'cart', 'checkout', or say hello! 😊");
      break;
    case 'hours':
      const hours = restaurant.hours || 'Please contact us for current hours';
      await messenger.sendTextMessage(userNumber, `⏰ Our hours: ${hours}`);
      break;

    case 'location':
      const address = restaurant.address || 'Address not available';
      await messenger.sendTextMessage(userNumber, `📍 We're located at: ${address}`);
      break;

    default:
      await messenger.sendTextMessage(userNumber, "How can I help you today? Try 'menu' or 'cart'.");
  }
}

/**
 * Handle Dialogflow responses
 */
async function handleDialogflowResponse(userNumber, text, restaurant, dialogflowResponse) {
  const intentName = dialogflowResponse?.intent?.displayName;
  const parameters = dialogflowResponse?.parameters || {};
  
  console.log('🤖 Dialogflow intent:', intentName, 'Parameters:', parameters);

  switch (intentName) {
    case 'add_item':
      await handleAddItemIntent(userNumber, text, restaurant, parameters);
      break;

    case 'show_menu':
      const menu = await RestaurantLookup.getRestaurantMenu(restaurant);
      await messenger.sendMenuMessage(userNumber, `🍽️ ${restaurant.name} Menu`, menu);
      break;

    case 'cart_status':
      await handleCartStatus(userNumber, restaurant);
      break;

    case 'checkout_start':
      await handleCheckoutStart(userNumber, restaurant);
      break;

    case 'remove_item':
      await handleRemoveItem(userNumber, text, restaurant, parameters);
      break;

    default:
      // Use Dialogflow's response if available
      const responseText = dialogflowResponse?.fulfillmentText || 
                          dialogflowResponse?.fulfillmentMessages?.[0]?.text?.text?.[0] ||
                          "I understand, but I need a bit more information.";
      await messenger.sendTextMessage(userNumber, responseText);
  }
}

/**
 * Handle adding items to cart
 */
async function handleAddItemIntent(userNumber, text, restaurant, parameters) {
  try {
    // Use GPT to extract item details from user message
    const PromptOrchestrator = require('./promptOrchestrator');
    const orchestrator = new PromptOrchestrator();
    
    const menu = await RestaurantLookup.getRestaurantMenu(restaurant);
    const extractionResult = await orchestrator.extractMenuItems(text, menu);

    if (extractionResult.items && extractionResult.items.length > 0) {
      let responseText = '';
      
      for (const item of extractionResult.items) {
        const menuItem = RestaurantLookup.findMenuItem(menu, item.name);
        
        if (menuItem) {
          await sessionManager.addToCart(restaurant.slug, userNumber, {
            name: menuItem.name,
            price: menuItem.price,
            quantity: item.quantity || 1
          });
          
          responseText += `✅ Added ${item.quantity || 1}x ${menuItem.name} to your cart\n`;
        } else {
          responseText += `❌ Sorry, we don't have "${item.name}" on our menu\n`;
        }
      }

      await messenger.sendTextMessage(userNumber, responseText + "\nSay 'cart' to see your order or 'menu' to browse more items!");
    } else {
      await messenger.sendTextMessage(userNumber, "I couldn't find that item on our menu. Try saying 'menu' to see what we have available!");
    }
  } catch (error) {
    console.error('Error handling add item:', error);
    await messenger.sendTextMessage(userNumber, "Sorry, I had trouble adding that to your cart. Please try again.");
  }
}

/**
 * Handle cart status requests
 */
async function handleCartStatus(userNumber, restaurant) {
  const cart = await sessionManager.getCart(restaurant.slug, userNumber);
  
  if (!cart.items || cart.items.length === 0) {
    await messenger.sendTextMessage(userNumber, "Your cart is empty! 🛒\n\nSay 'menu' to see what we have available.");
    return;
  }

  let cartText = `🛒 *Your Order:*\n\n`;
  cart.items.forEach(item => {
    cartText += `• ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
  });
  
  cartText += `\n💰 *Total: $${cart.total.toFixed(2)}*\n\n`;
  cartText += `Ready to order? Say 'checkout' to proceed!`;

  await messenger.sendTextMessage(userNumber, cartText);
}

/**
 * Handle checkout process
 */
async function handleCheckoutStart(userNumber, restaurant) {
  const cart = await sessionManager.getCart(restaurant.slug, userNumber);
  
  if (!cart.items || cart.items.length === 0) {
    await messenger.sendTextMessage(userNumber, "Your cart is empty! Add some items first by saying 'menu'.");
    return;
  }

  // For now, simulate order creation
  const orderNumber = `${restaurant.slug.toUpperCase()}-${Date.now().toString().slice(-6)}`;
  
  const order = {
    orderNumber,
    restaurant,
    items: cart.items,
    total: cart.total,
    estimatedTime: '20-30',
    status: 'confirmed'
  };

  // Send confirmation
  await messenger.sendOrderConfirmation(userNumber, order);
  
  // Clear cart
  await sessionManager.clearCart(restaurant.slug, userNumber);
}

/**
 * Handle remove item requests
 */
async function handleRemoveItem(userNumber, text, restaurant, parameters) {
  // Extract item name from text using simple matching
  const cart = await sessionManager.getCart(restaurant.slug, userNumber);
  
  if (!cart.items || cart.items.length === 0) {
    await messenger.sendTextMessage(userNumber, "Your cart is already empty!");
    return;
  }

  // Try to find item to remove (simplified - could use GPT for better extraction)
  const itemToRemove = cart.items.find(item => 
    text.toLowerCase().includes(item.name.toLowerCase())
  );

  if (itemToRemove) {
    await sessionManager.removeFromCart(restaurant.slug, userNumber, itemToRemove.name);
    await messenger.sendTextMessage(userNumber, `✅ Removed ${itemToRemove.name} from your cart!`);
  } else {
    await messenger.sendTextMessage(userNumber, "I couldn't find that item in your cart. Say 'cart' to see what you have.");
  }
}

/**
 * Handle GPT fallback for complex queries
 */
async function handleGPTFallback(userNumber, text, restaurant, session) {
  try {
    const PromptOrchestrator = require('./promptOrchestrator');
    const orchestrator = new PromptOrchestrator();
    
    const context = {
      restaurant: restaurant.name,
      menu: await RestaurantLookup.getRestaurantMenu(restaurant),
      cart: await sessionManager.getCart(restaurant.slug, userNumber),
      userMessage: text
    };

    const response = await orchestrator.generateResponse(context);
    await messenger.sendTextMessage(userNumber, response);

  } catch (error) {
    console.error('GPT fallback error:', error);
    await messenger.sendTextMessage(userNumber, "I'm not sure how to help with that. Try asking about our menu or placing an order!");
  }
}

async function handler(event, context) {
  try {
    // Ensure database connection for all operations
    await connectDB();
    
    if (event.httpMethod === 'GET') {
      // Verification challenge
      const params = event.queryStringParameters || {};
      const mode = params['hub.mode'];
      const token = params['hub.verify_token'];
      const challenge = params['hub.challenge'];
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('[WHATSAPP] Webhook verified');
        return { statusCode: 200, body: challenge };
      }
      return { statusCode: 403, body: 'Forbidden' };
    }

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body || '{}');
    const entry = body.entry || [];

    const allMessages = [];
    for (const ent of entry) {
      const msgs = normalizeMessage(ent);
      allMessages.push(...msgs);
    }

    if (!allMessages.length) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, messages: 0 }) };
    }

    // Process each message
    for (const msg of allMessages) {
      console.log(`[WHATSAPP INBOUND] from=${msg.from} type=${msg.type} text="${msg.text}"`);
      
      // Find restaurant by phone number ID
      const restaurant = await RestaurantLookup.findRestaurantByPhoneNumberId(msg.phoneNumberId);
      
      if (!restaurant) {
        console.error('❌ No restaurant found for phone number ID:', msg.phoneNumberId);
        await messenger.sendTextMessage(
          msg.from,
          "Sorry, this restaurant is not available right now. Please try again later."
        );
        continue;
      }

      // Process message through the system
      await processUserMessage(msg, restaurant);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: allMessages.length })
    };
  } catch (err) {
    console.error('[WHATSAPP] Handler error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

module.exports.handler = handler;
