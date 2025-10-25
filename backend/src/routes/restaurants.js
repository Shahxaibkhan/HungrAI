const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');


// Create restaurant (admin)
router.post('/', async (req,res)=>{
try{
const r = new Restaurant(req.body);
await r.save();
res.json(r);
}catch(e){ res.status(500).json({error:e.message}); }
});


// Add menu item
router.post('/:slug/menu', async (req,res)=>{
try{
const r = await Restaurant.findOne({slug: req.params.slug});
if(!r) return res.status(404).json({error:'Rest not found'});
const item = new MenuItem({ ...req.body, restaurant: r._id });
await item.save();
r.menu.push(item._id);
await r.save();
res.json(item);
}catch(e){ res.status(500).json({error:e.message}); }
});


// Get restaurant with menu
router.get('/:slug', async (req,res)=>{
const r = await Restaurant.findOne({slug:req.params.slug}).populate('menu');
if(!r) return res.status(404).json({error:'Not found'});
res.json(r);
});


module.exports = router;