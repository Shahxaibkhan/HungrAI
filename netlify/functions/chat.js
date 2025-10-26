const mongoose = require('mongoose');

// Import models from lib directory
const Restaurant = require('../../lib/models/Restaurant');
const Order = require('../../lib/models/Order');
const { buildPromptAndCallLLM } = require('../../lib/lib/promptOrchestrator');

// Database connection
let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Connect to database
    await connectToDatabase();

    const { message, userPhone = "guest", sessionId, restaurantSlug } = JSON.parse(event.body);

    const restaurant = await Restaurant.findOne({ slug: restaurantSlug }).populate("menu");
    if (!restaurant) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Restaurant not found" })
      };
    }

    // Simple menu response for testing
    if (message.toLowerCase().includes('menu') || message.toLowerCase().includes('show')) {
      const menuItems = restaurant.menu.map(item => `• ${item.title} - Rs.${item.price}`).join('\n');
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          reply: `Here's our menu:\n${menuItems}\n\nWhat would you like to order?`,
          _cartStatus: { items: 0, snapshot: [] },
          sessionKey: `netlify-${Date.now()}`
        })
      };
    }

    // Default response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        reply: `Hello! I'm Hungrai for ${restaurant.name}. You said: "${message}". Try saying "show menu" to see our options!`,
        _cartStatus: { items: 0, snapshot: [] },
        sessionKey: `netlify-${Date.now()}`
      })
    };

  } catch (e) {
    console.error("Chat function error:", e);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ error: e.message })
    };
  }
};