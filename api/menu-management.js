const mongoose = require('mongoose');
const MenuItem = require('./MenuItem');
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

async function menuManagementHandler(req, res) {
  await connectDB();

  const { method } = req;
  const itemId = req.query.id; // For GET/PUT/DELETE single item

  try {
    // Create new menu item
    if (method === 'POST') {
      const { restaurantId, title, description, price, category, imageUrl, isAvailable } = req.body;

      const menuItem = await MenuItem.create({
        restaurantId,
        title,
        description,
        price,
        category,
        imageUrl: imageUrl || '🍽️',
        isAvailable: isAvailable !== false
      });

      return res.status(201).json({
        message: 'Menu item created',
        menuItem
      });
    }

    // Get menu items for a restaurant
    if (method === 'GET' && req.query.restaurantId) {
      const { restaurantId } = req.query;
      const menuItems = await MenuItem.find({ restaurantId }).sort({ category: 1, title: 1 });

      return res.status(200).json({ menuItems });
    }

    // Get single menu item
    if (method === 'GET' && itemId) {
      const menuItem = await MenuItem.findById(itemId);
      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      return res.status(200).json({ menuItem });
    }

    // Update menu item
    if (method === 'PUT' && itemId) {
      const updates = req.body;
      const menuItem = await MenuItem.findByIdAndUpdate(itemId, updates, { new: true });

      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      return res.status(200).json({
        message: 'Menu item updated',
        menuItem
      });
    }

    // Delete menu item
    if (method === 'DELETE' && itemId) {
      const menuItem = await MenuItem.findByIdAndDelete(itemId);

      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      return res.status(200).json({ message: 'Menu item deleted' });
    }

    return res.status(400).json({ error: 'Invalid request' });

  } catch (error) {
    console.error('Menu management error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

module.exports.handler = createNetlifyHandler(menuManagementHandler);
