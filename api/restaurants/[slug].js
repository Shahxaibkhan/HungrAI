const mongoose = require('mongoose');
const Restaurant = require('../../../backend/src/models/Restaurant');
const MenuItem = require('../../../backend/src/models/MenuItem');

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

  const { slug } = req.query;

  try {
    if (req.method === 'GET') {
      // Get restaurant with menu
      const r = await Restaurant.findOne({ slug }).populate('menu');
      if (!r) return res.status(404).json({ error: 'Not found' });
      res.json(r);

    } else if (req.method === 'POST') {
      if (slug) {
        // Add menu item
        const r = await Restaurant.findOne({ slug });
        if (!r) return res.status(404).json({ error: 'Rest not found' });
        const item = new MenuItem({ ...req.body, restaurant: r._id });
        await item.save();
        r.menu.push(item._id);
        await r.save();
        res.json(item);
      } else {
        // Create restaurant (admin)
        const r = new Restaurant(req.body);
        await r.save();
        res.json(r);
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}