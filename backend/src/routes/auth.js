const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');


// NOTE: This is a simplified OTP flow for MVP. Replace SMS provider logic in production.
// POST /api/auth/request-otp { phone }
router.post('/request-otp', async (req,res)=>{
try{
const { phone } = req.body;
if(!phone) return res.status(400).json({error:'phone required'});
// generate mock OTP and store temp token (in prod, send SMS + persist OTP)
const otp = Math.floor(100000 + Math.random()*900000).toString();
// store otp in memory for MVP (replace with Redis in production)
global.__OTPS = global.__OTPS || {};
global.__OTPS[phone] = otp;
console.log('MVP OTP for', phone, otp);
return res.json({ sent: true, message: 'OTP sent (mock). Check server logs in dev.' });
}catch(e){ res.status(500).json({error:e.message}); }
});


// POST /api/auth/verify-otp { phone, otp }
router.post('/verify-otp', async (req,res)=>{
try{
const { phone, otp, name, email } = req.body;
if(!phone || !otp) return res.status(400).json({error:'phone and otp required'});
global.__OTPS = global.__OTPS || {};
if(global.__OTPS[phone] !== otp) return res.status(400).json({error:'Invalid OTP'});


let user = await User.findOne({ phone });
if(!user){
user = new User({ phone, name: name || 'Guest', email });
await user.save();
}


const token = jwt.sign({ id: user._id, phone: user.phone }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
delete global.__OTPS[phone];
res.json({ token, user });
}catch(e){ res.status(500).json({error:e.message}); }
});


module.exports = router;