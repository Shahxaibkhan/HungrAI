const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Restaurant = require('./Restaurant');
const User = require('./User');
const { createNetlifyHandler } = require('./netlify-adapter');

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

let cachedDb = null;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  cachedDb = await mongoose.connect(MONGO_URI);
  return cachedDb;
}

async function restaurantAuthHandler(req, res) {
  await connectDB();

  const { method } = req;

  try {
    if (method === 'POST' && req.path.includes('/register')) {
      // Register new restaurant
      const { name, slug, ownerName, email, phone, address, description, cuisine, logo, password } = req.body;

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create restaurant
      const restaurant = await Restaurant.create({
        name,
        slug,
        description,
        address,
        phone,
        isActive: true,
        logo: logo || '🍽️',
        cuisine: cuisine || 'Other'
      });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user account
      const user = await User.create({
        email,
        password: hashedPassword,
        name: ownerName,
        role: 'restaurant-owner',
        restaurantId: restaurant._id
      });

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id, restaurantId: restaurant._id, role: 'restaurant-owner' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'Restaurant registered successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          restaurantId: restaurant._id
        },
        token
      });
    }

    if (method === 'POST' && req.path.includes('/login')) {
      // Login
      const { email, password } = req.body;

      const user = await User.findOne({ email, role: 'restaurant-owner' });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user._id, restaurantId: user.restaurantId, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          restaurantId: user.restaurantId
        },
        token
      });
    }

    return res.status(404).json({ error: 'Route not found' });

  } catch (error) {
    console.error('Restaurant auth error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

module.exports.handler = createNetlifyHandler(restaurantAuthHandler);
