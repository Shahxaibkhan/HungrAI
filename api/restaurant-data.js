const mongoose = require('mongoose');
const Restaurant = require('./Restaurant');
const MenuItem = require('./MenuItem');
const Order = require('./Order');
const { createNetlifyHandler } = require('./netlify-adapter');

const MONGO_URI = process.env.MONGO_URI;

let cachedDb = null;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  cachedDb = await mongoose.connect(MONGO_URI);
  return cachedDb;
}

async function restaurantDataHandler(req, res) {
  await connectDB();

  const { method } = req;
  const restaurantId = req.query.restaurantId;

  try {
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID required' });
    }

    // Get restaurant details
    if (method === 'GET' && !req.path.includes('/menu') && !req.path.includes('/orders') && !req.path.includes('/stats')) {
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      return res.status(200).json({ restaurant });
    }

    // Get restaurant menu
    if (method === 'GET' && req.path.includes('/menu')) {
      const menuItems = await MenuItem.find({ restaurantId }).sort({ category: 1, title: 1 });
      return res.status(200).json({ menuItems });
    }

    // Get restaurant orders
    if (method === 'GET' && req.path.includes('/orders')) {
      const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 }).limit(50);
      return res.status(200).json({ orders });
    }

    // Get restaurant stats
    if (method === 'GET' && req.path.includes('/stats')) {
      const orders = await Order.find({ restaurantId });
      const menuItems = await MenuItem.find({ restaurantId });

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const totalMenuItems = menuItems.length;

      return res.status(200).json({
        totalOrders,
        totalRevenue,
        totalMenuItems,
        avgRating: 5.0 // Placeholder for future rating system
      });
    }

    // Update restaurant
    if (method === 'PUT') {
      const updates = req.body;
      const restaurant = await Restaurant.findByIdAndUpdate(restaurantId, updates, { new: true });

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      return res.status(200).json({ message: 'Restaurant updated', restaurant });
    }

    return res.status(404).json({ error: 'Route not found' });

  } catch (error) {
    console.error('Restaurant data error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

module.exports.handler = createNetlifyHandler(restaurantDataHandler);
