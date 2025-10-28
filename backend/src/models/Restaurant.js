const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  address: String,
  phone: String,
  email: String,
  
  // WhatsApp Integration
  whatsapp: {
    number: String,
    businessId: String,
    phoneNumberId: { type: String, required: true, unique: true },
    accessTokenRef: String,
    isActive: { type: Boolean, default: true },
    welcomeMessage: String
  },
  
  // AI Configuration
  ai: {
    mode: { type: String, enum: ['hybrid', 'dialogflow-only', 'gpt-only'], default: 'hybrid' },
    dialogflow: {
      projectId: String,
      agentId: String,
      confidenceThreshold: { type: Number, default: 0.65 },
      fallbackToGPT: { type: Boolean, default: true }
    },
    fallbackModel: { type: String, default: 'gpt-4o-mini' },
    customPrompts: {
      welcomeMessage: String,
      menuPrompt: String,
      orderConfirm: String
    }
  },
  
  // Menu Items
  menu: [{
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: String,
    image: String,
    available: { type: Boolean, default: true },
    prepTime: Number,
    aliases: [String]
  }],
  
  // Business Settings
  hours: {
    monday: String,
    tuesday: String,
    wednesday: String,
    thursday: String,
    friday: String,
    saturday: String,
    sunday: String
  },
  
  settings: {
    isActive: { type: Boolean, default: true },
    acceptsOrders: { type: Boolean, default: true },
    deliveryEnabled: { type: Boolean, default: true },
    pickupEnabled: { type: Boolean, default: true },
    minimumOrder: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    estimatedDeliveryTime: String,
    currency: { type: String, default: 'USD' },
    timezone: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Restaurant', restaurantSchema);