/**
 * Database Seeding Script
 * Run this to populate your MongoDB with demo restaurant data
 * 
 * Usage: node seedDatabase.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models from api folder
const Restaurant = require('./api/Restaurant');
const MenuItem = require('./api/MenuItem');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI not found in environment variables');
  console.log('Please create a .env file with MONGO_URI=your_mongodb_connection_string');
  process.exit(1);
}

async function seedDatabase() {
  try {
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create demo restaurant
    console.log('🏪 Creating demo restaurant...');
    const restaurant = await Restaurant.create({
      name: 'Demo Burger Bistro',
      slug: 'demo-burger-bistro',
      description: 'Delicious burgers, fries, and drinks',
      address: '123 Demo Street, Food City',
      phone: '+1-555-DEMO',
      isActive: true
    });
    console.log('✅ Created restaurant:', restaurant.name);

    // Create menu items
    console.log('🍔 Creating menu items...');
    const menuItems = [
      {
        restaurantId: restaurant._id,
        title: 'Classic Burger',
        description: 'Juicy beef patty with lettuce, tomato, and special sauce',
        price: 8.99,
        category: 'Burgers',
        isAvailable: true,
        imageUrl: '🍔'
      },
      {
        restaurantId: restaurant._id,
        title: 'Cheese Burger',
        description: 'Classic burger with melted cheddar cheese',
        price: 9.99,
        category: 'Burgers',
        isAvailable: true,
        imageUrl: '🍔'
      },
      {
        restaurantId: restaurant._id,
        title: 'Crispy Fries',
        description: 'Golden french fries with sea salt',
        price: 3.99,
        category: 'Sides',
        isAvailable: true,
        imageUrl: '🍟'
      },
      {
        restaurantId: restaurant._id,
        title: 'Soft Drink',
        description: 'Refreshing cola or lemon-lime soda',
        price: 1.99,
        category: 'Beverages',
        isAvailable: true,
        imageUrl: '🥤'
      },
      {
        restaurantId: restaurant._id,
        title: 'Milkshake',
        description: 'Creamy vanilla, chocolate, or strawberry milkshake',
        price: 4.99,
        category: 'Beverages',
        isAvailable: true,
        imageUrl: '🥤'
      }
    ];

    await MenuItem.insertMany(menuItems);
    console.log('✅ Created', menuItems.length, 'menu items');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Restaurant:', restaurant.name);
    console.log('  - Slug:', restaurant.slug);
    console.log('  - Menu Items:', menuItems.length);
    console.log('\n✨ You can now use the app with this demo data!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding function
seedDatabase();
