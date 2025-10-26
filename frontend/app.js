// Use environment variable for API base URL, fallback to localhost for development
const apiBase = window.API_BASE_URL || "http://localhost:4000"; // backend base URL
let currentRestaurant = null;
let sessionId = localStorage.getItem("hungraiSession");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("hungraiSession", sessionId);
}

// Debug: app loaded marker and persistent reload counter
console.log("[hungrai] app.js loaded, sessionId=", sessionId);
const reloadCountKey = 'hungrai_reload_count';
const prevReloads = parseInt(localStorage.getItem(reloadCountKey) || '0', 10);
localStorage.setItem(reloadCountKey, String(prevReloads + 1));
console.log(`[hungrai] page reload count: ${prevReloads + 1}`);

const brandsDiv = document.getElementById("brands");
const chatMessages = document.getElementById("chatMessages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const chatTitle = document.getElementById("chatTitle");

// Ensure the send button is explicitly a non-submit button
try { sendBtn.type = 'button'; } catch (e) { /* ignore */ }

// load restaurants (stub for now)
async function loadRestaurants() {
  const data = [
    { name: "Demo Burger Bistro", slug: "demo-burger-bistro", logo: "🍔" },
    { name: "Desi Chai Stop", slug: "desi-chai-stop", logo: "☕" },
    { name: "Pizza Naan", slug: "pizza-naan", logo: "🍕" }
  ];
  brandsDiv.innerHTML = "";
  data.forEach(r => {
    const card = document.createElement("div");
    card.className = "brandCard";
    card.innerHTML = `<div style="font-size:32px">${r.logo}</div><div>${r.name}</div>`;
    card.onclick = () => selectRestaurant(r);
    brandsDiv.appendChild(card);
  });
  
  // Update selection indicator in case we're refreshing with an active restaurant
  updateRestaurantSelection();
}

function selectRestaurant(r) {
  // Only clear chat if switching to a different restaurant
  const isNewRestaurant = !currentRestaurant || currentRestaurant.slug !== r.slug;
  
  if (isNewRestaurant) {
    currentRestaurant = r;
    chatTitle.innerText = `Chatting with ${r.name}`;
    chatMessages.innerHTML = "";
    
    // Generate a new sessionId for this restaurant conversation
    sessionId = crypto.randomUUID();
    localStorage.setItem("hungraiSession", sessionId);
    console.log("[hungrai] New session started for", r.name, "sessionId=", sessionId);
    
    appendMsg("bot", `👋 Hi! I'm Hungrai for ${r.name}. What would you like to order today?`);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    
    // Update visual selection indicator
    updateRestaurantSelection();
  } else {
    // Already chatting with this restaurant, just scroll to chat
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }
}

function updateRestaurantSelection() {
  // Add visual indicator for selected restaurant
  [...brandsDiv.children].forEach(card => {
    card.classList.remove('selected');
  });
  
  if (currentRestaurant) {
    [...brandsDiv.children].forEach(card => {
      if (card.innerText.includes(currentRestaurant.name)) {
        card.classList.add('selected');
      }
    });
  }
}

// Helper function to clean any JSON or evaluation feedback from text
function cleanJSONFromText(text) {
  // Remove any JSON-like object at the end of the message
  text = text.replace(/\s*(\{[\s\S]*\})\s*$/, "");
  
  // If there's still a JSON-like structure, try to extract just the text before it
  const jsonStartPos = text.indexOf('{');
  if (jsonStartPos > 0 && text.indexOf('}', jsonStartPos) > jsonStartPos) {
    // Only take the part before the JSON if it's not empty
    const beforeJson = text.substring(0, jsonStartPos).trim();
    if (beforeJson) {
      text = beforeJson;
    }
  }
  
  // Remove any evaluation feedback phrases
  text = text
    .replace(/An improved response could be[:'].*$/im, "")
    .replace(/This response (fails|doesn't meet).*$/im, "")
    .replace(/I suggest improving.*$/im, "")
    .replace(/The response (is missing|needs|lacks).*$/im, "")
    .replace(/\[Suggestion\]:.*$/im, "");
  
  return text;
}

function appendMsg(role, text) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  
  // Create avatar
  const avatar = document.createElement("div");
  avatar.className = "messageAvatar";
  avatar.textContent = role === "bot" ? "🤖" : "👤";
  
  // Create message bubble
  const bubble = document.createElement("div");
  bubble.className = "messageBubble";
  
  // Clean text of any JSON objects
  if (role === "bot") {
    text = cleanJSONFromText(text);
  }
  
  // Format message content for better readability
  if (role === "bot") {
    // Convert bullet points to proper HTML lists for menu items
    if (text.includes("•") && !text.includes("<div class='typing-indicator'>")) {
      const parts = text.split(/\n{2,}/g);
      const formattedParts = parts.map(part => {
        if (part.includes("•")) {
          const lines = part.split("\n");
          return lines.map(line => {
            if (line.trim().startsWith("•")) {
              return `<li>${line.replace("•", "").trim()}</li>`;
            }
            return `<p>${line}</p>`;
          }).join("");
        }
        return `<p>${part}</p>`;
      });
      
      // Replace bullet lists with proper <ul> elements
      let htmlContent = formattedParts.join("");
      if (htmlContent.includes("<li>")) {
        htmlContent = htmlContent.replace(/(<li>.*?<\/li>)+/g, match => {
          return `<ul class="menu-list">${match}</ul>`;
        });
      }
      
      // Highlight order confirmations
      if (htmlContent.includes("Order confirmed")) {
        htmlContent = htmlContent.replace(/Order confirmed!/g, 
          '<span class="order-confirmed">✅ Order confirmed!</span>');
      }
      
      bubble.innerHTML = htmlContent;
    } else {
      bubble.innerHTML = text;
    }
  } else {
    bubble.innerHTML = text;
  }
  
  // Append avatar and bubble to message div
  div.appendChild(avatar);
  div.appendChild(bubble);
  
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

async function sendMessage() {
  const msg = msgInput.value.trim();
  if (!msg) return;

  // check if restaurant is selected
  if (!currentRestaurant) {
    appendMsg("bot", "⚠️ Please select a restaurant before chatting.");
    return;
  }

  // append user's message
  appendMsg("user", msg);
  msgInput.value = "";
  msgInput.disabled = true; // prevent double send while waiting
  sendBtn.disabled = true; // also disable send button

  // append bot placeholder with typing indicator
  const botMsg = appendMsg("bot", "<div class='typing-indicator'>Hungrai is typing<span>.</span><span>.</span><span>.</span></div>");
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await fetch(
      `${apiBase}/.netlify/functions/chat?slug=${currentRestaurant.slug}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, userPhone: "guest", sessionId }),
      }
    );

    if (!res.ok) {
      const errorStatus = res.status;
      if (errorStatus === 404) {
        throw new Error("Restaurant not found");
      } else {
        throw new Error("Server error: " + errorStatus);
      }
    }

    const data = await res.json();

    // Extract text from response, handling different response formats
    let text;
    if (typeof data.reply === "string") {
      text = data.reply;
    } else if (data.reply && typeof data.reply === "object" && data.reply.reply_text) {
      // Handle case where full JSON object is returned instead of just the text
      text = data.reply.reply_text;
    } else if (data.error) {
      // Handle explicit error messages from the server
      text = `⚠️ Error: ${data.error}`;
    } else {
      text = "Sorry, I didn't understand that. Could you try rephrasing?";
    }
    
    // Clean up response by removing any JSON objects that might be appended to the text
    text = cleanJSONFromText(text);
    
    // Collect evaluation data for debug mode but don't display it yet
    let evalDebugInfo = "";
    // Check for _evaluation (internal) field first, then fallback to evaluation for backwards compatibility
    const evalData = data._evaluation || data.evaluation;
    if (evalData && localStorage.getItem("hungraiDebugMode") === "true") {
      evalDebugInfo = `
        <div class="eval-debug">
          <details>
            <summary>Response Quality: ${evalData.passes ? '✅ Passed' : '❌ Failed'}</summary>
            <div>Attempts: ${evalData.attempts || 1}</div>
            <div>Feedback: ${evalData.feedback || 'None provided'}</div>
          </details>
        </div>
      `;
    }

    // smooth typing effect - we'll append debug info after
    botMsg.innerHTML = "";
    let i = 0;
    const typingSpeed = 15; // slightly faster
    const typer = setInterval(() => {
      botMsg.innerHTML += text[i++];
      chatMessages.scrollTop = chatMessages.scrollHeight;
      if (i >= text.length) {
        clearInterval(typer);
        
        // Add debug info after typing effect is complete, only in debug mode
        if (evalDebugInfo && localStorage.getItem("hungraiDebugMode") === "true") {
          const debugElement = document.createElement("div");
          debugElement.innerHTML = evalDebugInfo;
          botMsg.appendChild(debugElement.firstElementChild);
        }
      }
    }, typingSpeed);
    
    // If we have an order ID, store it and show order tracking
    if (data.orderId) {
      localStorage.setItem("lastOrderId", data.orderId);
      console.log("[hungrai] Order placed:", data.orderId);
      
      // Show order tracking UI
      showOrderTracking(data.orderId);
    }
  } catch (e) {
    console.error("Chat error:", e);
    botMsg.innerHTML =
      `⚠️ Sorry, Hungrai is having trouble connecting. ${e.message}. Please try again in a moment.`;
  } finally {
    msgInput.disabled = false;
    sendBtn.disabled = false;
    msgInput.focus();
  }
}

sendBtn.onclick = sendMessage;
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    // Prevent implicit form submission / navigation
    e.preventDefault();
    e.stopPropagation();
    sendMessage();
  }
});

// Log navigation type to help detect full-page reloads vs SPA navigation
window.addEventListener('load', () => {
  try {
    const navEntries = performance.getEntriesByType('navigation');
    const navType = navEntries && navEntries.length ? navEntries[0].type : (performance && performance.navigation ? performance.navigation.type : 'unknown');
    console.log('[hungrai] navigation type:', navType, navEntries);
  } catch (err) {
    console.log('[hungrai] navigation type check failed', err.message);
  }
});

document.getElementById("searchBox").addEventListener("input", e => {
  const val = e.target.value.toLowerCase();
  [...brandsDiv.children].forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(val) ? "flex" : "none";
  });
});

// Debug mode toggle - press Ctrl+Alt+D to toggle
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.altKey && e.key === 'd') {
    const currentMode = localStorage.getItem("hungraiDebugMode") === "true";
    localStorage.setItem("hungraiDebugMode", !currentMode);
    console.log(`Debug mode ${!currentMode ? 'enabled' : 'disabled'}`);
    
    // Show a temporary notification
    const notification = document.createElement("div");
    notification.style.position = "fixed";
    notification.style.bottom = "20px";
    notification.style.right = "20px";
    notification.style.padding = "10px 15px";
    notification.style.backgroundColor = !currentMode ? "#4CAF50" : "#F44336";
    notification.style.color = "white";
    notification.style.borderRadius = "4px";
    notification.style.zIndex = "1000";
    notification.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    notification.innerHTML = `Debug Mode: ${!currentMode ? 'ON' : 'OFF'}`;
    
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
  }
});

function showOrderTracking(orderId) {
  // Create order tracking UI
  const trackingDiv = document.createElement("div");
  trackingDiv.id = "orderTracking";
  trackingDiv.className = "order-tracking";
  trackingDiv.innerHTML = `
    <div class="order-tracking-header">
      <h3>🎉 Order Confirmed!</h3>
      <p>Order ID: <code>${orderId}</code></p>
    </div>
    <div class="order-status">
      <div class="status-step active" data-status="received">
        <div class="status-icon">📦</div>
        <div class="status-text">Order Received</div>
      </div>
      <div class="status-step" data-status="confirmed">
        <div class="status-icon">✅</div>
        <div class="status-text">Order Confirmed</div>
      </div>
      <div class="status-step" data-status="preparing">
        <div class="status-icon">👨‍🍳</div>
        <div class="status-text">Preparing</div>
      </div>
      <div class="status-step" data-status="ready">
        <div class="status-icon">🍽️</div>
        <div class="status-text">Ready for Pickup</div>
      </div>
      <div class="status-step" data-status="delivered">
        <div class="status-icon">🚀</div>
        <div class="status-text">Delivered</div>
      </div>
    </div>
    <div class="order-actions">
      <button id="trackOrderBtn" class="track-btn">🔄 Refresh Status</button>
      <button id="closeTrackingBtn" class="close-btn">✕ Close</button>
    </div>
  `;
  
  // Add to chat
  chatMessages.appendChild(trackingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Add event listeners
  document.getElementById("trackOrderBtn").onclick = () => updateOrderStatus(orderId);
  document.getElementById("closeTrackingBtn").onclick = () => {
    trackingDiv.remove();
  };
  
  // Start auto-refresh every 30 seconds
  const autoRefresh = setInterval(() => {
    if (document.getElementById("orderTracking")) {
      updateOrderStatus(orderId);
    } else {
      clearInterval(autoRefresh);
    }
  }, 30000);
  
  // Initial status update
  updateOrderStatus(orderId);
}

async function updateOrderStatus(orderId) {
  try {
    const response = await fetch(`${apiBase}/.netlify/functions/orders/${orderId}`);
    const data = await response.json();
    
    if (response.ok) {
      updateTrackingUI(data);
    } else {
      console.error("Failed to get order status:", data.error);
    }
  } catch (error) {
    console.error("Error fetching order status:", error);
  }
}

function updateTrackingUI(orderData) {
  const trackingDiv = document.getElementById("orderTracking");
  if (!trackingDiv) return;
  
  const statusSteps = trackingDiv.querySelectorAll(".status-step");
  const currentStatus = orderData.status;
  
  // Status progression order
  const statusOrder = ['received', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  // Update visual progress
  statusSteps.forEach((step, index) => {
    if (index <= currentIndex) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });
  
  // Update time remaining if applicable
  if (orderData.timeRemaining && currentStatus !== 'delivered') {
    const timeDiv = trackingDiv.querySelector('.time-remaining') || document.createElement('div');
    timeDiv.className = 'time-remaining';
    timeDiv.innerHTML = `<p>⏰ Estimated time remaining: ${orderData.timeRemaining} minutes</p>`;
    
    const actionsDiv = trackingDiv.querySelector('.order-actions');
    actionsDiv.insertBefore(timeDiv, actionsDiv.firstChild);
  }
  
  console.log(`[hungrai] Order ${orderData.orderId} status: ${currentStatus}`);
}

loadRestaurants();
