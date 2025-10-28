const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: {
    phoneNumber: { type: String, required: true },
    name: String,
    address: String
  },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    customizations: [String]
  }],
  
  totals: {
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  type: {
    type: String,
    enum: ['delivery', 'pickup'],
    default: 'delivery'
  },
  
  payment: {
    method: String,
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    transactionId: String
  },
  
  timestamps: {
    ordered: { type: Date, default: Date.now },
    confirmed: Date,
    prepared: Date,
    delivered: Date
  },
  
  notes: String,
  estimatedDeliveryTime: Date
}, {
  timestamps: true
});

// Generate order number
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);