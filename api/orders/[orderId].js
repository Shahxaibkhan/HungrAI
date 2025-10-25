const mongoose = require('mongoose');
const Order = require('../../../backend/src/models/Order');

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

export default async function handler(req, res) {
  await connectToDatabase();

  const { orderId } = req.query;

  try {
    if (req.method === 'GET') {
      // Get order status
      const order = await Order.findById(orderId)
        .populate('restaurant', 'name')
        .select('status statusHistory estimatedReadyTime actualDeliveryTime createdAt items totalEstimate');

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Calculate estimated time remaining
      let timeRemaining = null;
      if (order.status !== 'delivered' && order.status !== 'cancelled' && order.estimatedReadyTime) {
        const now = new Date();
        const readyTime = new Date(order.estimatedReadyTime);
        const diffMs = readyTime - now;
        timeRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60))); // minutes
      }

      res.json({
        orderId: order._id,
        status: order.status,
        statusHistory: order.statusHistory,
        estimatedReadyTime: order.estimatedReadyTime,
        timeRemaining,
        createdAt: order.createdAt,
        items: order.items,
        total: order.totalEstimate,
        restaurant: order.restaurant
      });

    } else if (req.method === 'POST') {
      // Update order status
      const { status, note } = req.body;

      const validStatuses = ['received', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Update status and add to history
      order.status = status;
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note: note || `Status updated to ${status}`
      });

      // Set delivery time if delivered
      if (status === 'delivered') {
        order.actualDeliveryTime = new Date();
      }

      await order.save();

      res.json({
        orderId: order._id,
        status: order.status,
        statusHistory: order.statusHistory,
        message: `Order status updated to ${status}`
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in orders API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}