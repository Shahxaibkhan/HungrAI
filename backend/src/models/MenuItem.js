const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  image: String,
  available: { type: Boolean, default: true },
  prepTime: Number,
  aliases: [String],
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  
  // Nutritional info (optional)
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  
  // Customization options
  options: [{
    name: String,
    choices: [{
      name: String,
      price: Number
    }]
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('MenuItem', menuItemSchema);