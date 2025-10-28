const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  name: String,
  email: String,
  
  preferences: {
    favoriteRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
    favoriteItems: [String],
    dietaryRestrictions: [String],
    defaultAddress: String
  },
  
  orderHistory: [{
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    date: { type: Date, default: Date.now },
    total: Number
  }],
  
  // WhatsApp-specific data
  whatsapp: {
    lastInteraction: { type: Date, default: Date.now },
    conversationState: String,
    preferredLanguage: { type: String, default: 'en' }
  },
  
  // User analytics
  analytics: {
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    lastOrderDate: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);