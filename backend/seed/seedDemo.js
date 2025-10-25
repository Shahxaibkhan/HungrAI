/**
* Simple seed script to create demo restaurants + items.
* Usage: node backend/seed/seedDemo.js (ensure MONGO_URI in .env)
*/


require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../src/models/Restaurant');
const MenuItem = require('../src/models/MenuItem');


async function seed(){
await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true });
console.log('Connected to DB');


// Remove old demo data
await Restaurant.deleteMany({slug: /demo-/ });


const rest = new Restaurant({ name: 'Demo Burger Bistro', slug: 'demo-burger-bistro', logo:'', brandColor:'#ff6b6b', contactNumber: '+92300' });
await rest.save();


const items = [
{ title: 'Truffle Melt Burger', description:'Beef patty, truffle mayo, cheddar', price:1850, tags:['bestseller','truffle'] },
{ title: 'Smoky BBQ Chicken', description:'Grilled chicken, smoky sauce', price:1550, tags:['chicken','smoky'] },
{ title: 'Loaded Fries', description:'Crispy fries with toppings', price:690, tags:['sides'] }
];


for(const it of items){
const m = new MenuItem({ ...it, restaurant: rest._id });
await m.save();
rest.menu.push(m._id);
}


await rest.save();
console.log('Seed complete');
process.exit(0);
}


seed().catch(e=>{ console.error(e); process.exit(1); });