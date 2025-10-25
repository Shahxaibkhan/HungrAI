const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /api/orders/:orderId/status - Get order status
router.get('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;

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

  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

// POST /api/orders/:orderId/status - Update order status (for restaurant/admin use)
router.post('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
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

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;