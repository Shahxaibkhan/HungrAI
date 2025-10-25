// Import axios instead of fetch for better Node.js compatibility
const axios = require('axios');
const crypto = require('crypto');

// Configuration
const API_BASE = 'http://localhost:4000';
const RESTAURANT_SLUG = 'demo-burger-bistro';
const SESSION_ID = crypto.randomUUID(); // Create a unique session ID for testing

// Helper function for sending messages
async function sendMessage(message) {
  console.log(`\n👤 User: ${message}`);
  
  try {
    const response = await axios.post(
      `${API_BASE}/api/chat/${RESTAURANT_SLUG}/message`,
      { message, sessionId: SESSION_ID },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    const data = response.data;
    console.log(`🤖 Bot: ${data.reply}`);
    
    // Show debug info if present
    if (data._evaluation) {
      console.log(`🧠 Evaluation: ${data._evaluation.passes ? '✅ PASS' : '❌ FAIL'}`);
      if (data._evaluation.feedback) {
        console.log(`📝 Feedback: ${data._evaluation.feedback}`);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error:', error.response ? `API Error: ${error.response.status}` : error.message);
    return { error: error.message };
  }
}

// Test scenarios
async function runTests() {
  console.log('🧪 HUNGRAI TEST SUITE 🧪');
  console.log('========================\n');
  
  // Test 1: Cart State Awareness
  console.log('\n📋 TEST 1: CART STATE AWARENESS');
  console.log('----------------------------');
  await sendMessage('Hi there');
  await sendMessage('What do you have on the menu?');
  await sendMessage('I want to order fries');
  const cartCheck = await sendMessage('What is in my cart?');
  await sendMessage('What is my total?');
  
  // Test 2: Add All Items
  console.log('\n📋 TEST 2: ADD ALL ITEMS');
  console.log('----------------------------');
  await sendMessage('I want to order everything on the menu');
  await sendMessage('yes');
  await sendMessage('checkout');
  
  // Test 3: Yes to Checkout
  console.log('\n📋 TEST 3: YES TO CHECKOUT');
  console.log('----------------------------');
  await sendMessage('Add the burger');
  await sendMessage('Is that it for my order?');
  await sendMessage('yes');
  await sendMessage('what is my total?');
  
  // Test 4: Language Test
  console.log('\n📋 TEST 4: LANGUAGE TEST');
  console.log('----------------------------');
  await sendMessage('kia menu hai?');
  await sendMessage('sirf fries');
  await sendMessage('checkout');
  
  console.log('\n✅ Tests completed!');
}

// Run the tests
runTests();