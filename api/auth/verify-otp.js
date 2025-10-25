const mongoose = require('mongoose');
const User = require('../../../lib/models/User');
const jwt = require('jsonwebtoken');

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

// Global OTP storage (in production, use Redis or database)
global.__OTPS = global.__OTPS || {};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectToDatabase();

  try {
    const { phone, otp, name, email } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'phone and otp required' });

    if (global.__OTPS[phone] !== otp) return res.status(400).json({ error: 'Invalid OTP' });

    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone, name: name || 'Guest', email });
      await user.save();
    }

    const token = jwt.sign({ id: user._id, phone: user.phone }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    delete global.__OTPS[phone];
    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}