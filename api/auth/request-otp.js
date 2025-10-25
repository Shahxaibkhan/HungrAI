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
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });

    // generate mock OTP and store temp token (in prod, send SMS + persist OTP)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // store otp in memory for MVP (replace with Redis in production)
    global.__OTPS[phone] = otp;
    console.log('MVP OTP for', phone, otp);

    return res.json({ sent: true, message: 'OTP sent (mock). Check server logs in dev.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}