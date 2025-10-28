// Sample restaurant data for testing WhatsApp integration
const mongoose = require('mongoose');

const sampleRestaurantData = {
  name: "HungerAI Demo Restaurant",
  slug: "hungerai-demo",
  description: "Delicious food delivered fast with AI ordering!",
  address: "123 Tech Street, Innovation City",
  phone: "+1-555-HUNGER",
  email: "orders@hungerai-demo.com",
  
  // WhatsApp Integration Settings
  whatsapp: {
    number: "+15551234567", // Your WhatsApp Business number
    businessId: process.env.WHATSAPP_BUSINESS_ID,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessTokenRef: "env:WHATSAPP_ACCESS_TOKEN", // Reference to env var
    isActive: true,
    welcomeMessage: "Welcome to HungerAI Demo! 🍽️ I can help you order delicious food. Say 'menu' to get started!"
  },

  // AI Configuration
  ai: {
    mode: "hybrid", // hybrid, dialogflow-only, gpt-only
    dialogflow: {
      projectId: process.env.DIALOGFLOW_PROJECT_ID,
      agentId: process.env.DIALOGFLOW_AGENT_ID || null, // null for ES
      confidenceThreshold: 0.65,
      fallbackToGPT: true
    },
    fallbackModel: "gpt-4o-mini",
    customPrompts: {
      welcomeMessage: "I'm your AI food assistant! How can I help you today?",
      menuPrompt: "Here's our delicious menu. What catches your eye?",
      orderConfirm: "Great choice! I've added that to your cart. Anything else?"
    }
  },

  // Sample Menu Items
  menu: [
    {
      name: "Classic Cheeseburger",
      description: "Juicy beef patty with cheese, lettuce, tomato, and special sauce",
      price: 12.99,
      category: "Burgers",
      image: "https://example.com/cheeseburger.jpg",
      available: true,
      prepTime: 15,
      aliases: ["burger", "cheeseburger", "beef burger"]
    },
    {
      name: "Margherita Pizza",
      description: "Fresh mozzarella, tomato sauce, and basil on thin crust",
      price: 14.99,
      category: "Pizza",
      image: "https://example.com/margherita.jpg",
      available: true,
      prepTime: 20,
      aliases: ["pizza", "margherita", "cheese pizza"]
    },
    {
      name: "Caesar Salad",
      description: "Crisp romaine lettuce, parmesan, croutons, and Caesar dressing",
      price: 9.99,
      category: "Salads",
      image: "https://example.com/caesar.jpg",
      available: true,
      prepTime: 10,
      aliases: ["salad", "caesar", "green salad"]
    },
    {
      name: "Chicken Wings",
      description: "Crispy wings with your choice of Buffalo, BBQ, or Honey Garlic sauce",
      price: 11.99,
      category: "Appetizers",
      image: "https://example.com/wings.jpg",
      available: true,
      prepTime: 12,
      aliases: ["wings", "chicken", "buffalo wings"]
    },
    {
      name: "Fish Tacos",
      description: "Grilled fish with cabbage slaw and chipotle mayo in soft tortillas",
      price: 13.99,
      category: "Mexican",
      image: "https://example.com/tacos.jpg",
      available: true,
      prepTime: 18,
      aliases: ["tacos", "fish tacos", "mexican"]
    },
    {
      name: "Chocolate Milkshake",
      description: "Rich chocolate ice cream blended to perfection",
      price: 5.99,
      category: "Beverages",
      image: "https://example.com/milkshake.jpg",
      available: true,
      prepTime: 5,
      aliases: ["milkshake", "shake", "chocolate shake", "drink"]
    },
    {
      name: "French Fries",
      description: "Golden crispy fries with sea salt",
      price: 4.99,
      category: "Sides",
      image: "https://example.com/fries.jpg",
      available: true,
      prepTime: 8,
      aliases: ["fries", "chips", "french fries", "potato"]
    },
    {
      name: "Veggie Wrap",
      description: "Fresh vegetables, hummus, and avocado in a spinach tortilla",
      price: 10.99,
      category: "Healthy",
      image: "https://example.com/wrap.jpg",
      available: true,
      prepTime: 12,
      aliases: ["wrap", "veggie wrap", "vegetarian", "healthy"]
    }
  ],

  // Business Settings
  hours: {
    monday: "11:00 AM - 10:00 PM",
    tuesday: "11:00 AM - 10:00 PM", 
    wednesday: "11:00 AM - 10:00 PM",
    thursday: "11:00 AM - 10:00 PM",
    friday: "11:00 AM - 11:00 PM",
    saturday: "10:00 AM - 11:00 PM",
    sunday: "10:00 AM - 9:00 PM"
  },

  // Billing & Analytics (removed from schema since not defined)
  // billing: {
  //   plan: "basic", // basic, premium, enterprise
  //   monthlyQuota: 2000,
  //   currentUsage: 0,
  //   billingEmail: "billing@hungerai-demo.com"
  // },

  // analytics: {
  //   totalOrders: 0,
  //   totalRevenue: 0,
  //   averageOrderValue: 0,
  //   popularItems: [],
  //   peakHours: []
  // },

  // // Branding
  // branding: {
  //   primaryColor: "#FF6B35",
  //   secondaryColor: "#004E89", 
  //   logo: "https://example.com/logo.png",
  //   favicon: "https://example.com/favicon.ico"
  // },

  settings: {
    isActive: true,
    acceptsOrders: true,
    deliveryEnabled: true,
    pickupEnabled: true,
    minimumOrder: 15.00,
    deliveryFee: 2.99,
    estimatedDeliveryTime: "30-45 minutes",
    currency: "USD",
    timezone: "America/New_York"
  }
};

/**
 * Create or update sample restaurant in database
 * @returns {Promise<Object>} Created restaurant document
 */
async function createSampleRestaurant() {
  try {
    const Restaurant = require('./Restaurant');
    
    // Check if demo restaurant already exists
    let restaurant = await Restaurant.findOne({ slug: sampleRestaurantData.slug });
    
    if (restaurant) {
      console.log('✅ Demo restaurant already exists:', restaurant.name);
      return restaurant;
    }

    // Create new restaurant
    restaurant = new Restaurant(sampleRestaurantData);
    await restaurant.save();
    
    console.log('🎉 Created demo restaurant:', restaurant.name);
    console.log('📞 WhatsApp Phone Number ID:', restaurant.whatsapp.phoneNumberId);
    console.log('🍽️ Menu items:', restaurant.menu.length);
    
    return restaurant;
    
  } catch (error) {
    console.error('❌ Error creating sample restaurant:', error);
    throw error;
  }
}

/**
 * Update restaurant's WhatsApp phone number ID
 * @param {string} phoneNumberId - WhatsApp phone number ID
 * @returns {Promise<Object>} Updated restaurant
 */
async function updatePhoneNumberId(phoneNumberId) {
  try {
    const Restaurant = require('./Restaurant');
    
    const restaurant = await Restaurant.findOneAndUpdate(
      { slug: sampleRestaurantData.slug },
      { 
        'whatsapp.phoneNumberId': phoneNumberId,
        'whatsapp.isActive': true 
      },
      { new: true }
    );
    
    if (restaurant) {
      console.log('✅ Updated phone number ID for:', restaurant.name);
      return restaurant;
    } else {
      console.log('❌ Demo restaurant not found');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error updating phone number ID:', error);
    throw error;
  }
}

module.exports = {
  sampleRestaurantData,
  createSampleRestaurant,
  updatePhoneNumberId
};