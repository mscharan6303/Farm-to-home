require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/farm-to-home');
    console.log('Connected to DB for seeding');

    // Create a demo farmer
    let farmer = await User.findOne({ email: 'farmer@demo.com' });
    if (!farmer) {
      farmer = new User({
        name: 'Demo Farmer',
        email: 'farmer@demo.com',
        phone: '1234567890',
        password: 'password123',
        role: 'farmer',
        address: '123 Farm Lane, Agriculture City',
        farmName: 'Green Acres Demo Farm',
        verified: true
      });
      await farmer.save();
      console.log('Created Demo Farmer');
    }

    const products = [
      {
        name: 'Fresh Tomatoes',
        category: 'Vegetables',
        description: 'Juicy, ripe organic tomatoes harvested this morning.',
        price: 45,
        discountPrice: 40,
        stock: 50,
        unit: 'kg',
        images: [{ url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80', publicId: 'tomato_demo' }],
        organic: true,
        seasonal: true,
        nutrition: 'High in Vitamin C and Lycopene',
        farmer: farmer._id,
        rating: 4.5,
        numReviews: 12,
      },
      {
        name: 'Organic Bananas',
        category: 'Fruits',
        description: 'Sweet and perfectly ripe bananas, grown without pesticides.',
        price: 60,
        stock: 100,
        unit: 'dozen',
        images: [{ url: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500&q=80', publicId: 'banana_demo' }],
        organic: true,
        farmer: farmer._id,
        rating: 4.8,
        numReviews: 25,
      },
      {
        name: 'Spinach Bunch',
        category: 'Leafy Vegetables',
        description: 'Crisp, iron-rich spinach leaves.',
        price: 25,
        stock: 30,
        unit: 'bunch',
        images: [{ url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80', publicId: 'spinach_demo' }],
        organic: false,
        farmer: farmer._id,
        rating: 4.2,
        numReviews: 8,
      },
      {
        name: 'Farm Fresh Milk',
        category: 'Dairy',
        description: 'Raw, unpasteurized milk straight from the farm.',
        price: 70,
        stock: 20,
        unit: 'liter',
        images: [{ url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80', publicId: 'milk_demo' }],
        organic: true,
        farmer: farmer._id,
      },
      {
        name: 'Brown Rice',
        category: 'Grains',
        description: 'Nutritious whole grain brown rice.',
        price: 85,
        stock: 200,
        unit: 'kg',
        images: [{ url: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=500&q=80', publicId: 'rice_demo' }],
        organic: true,
        farmer: farmer._id,
      }
    ];

    await Product.insertMany(products);
    console.log('Inserted Demo Products');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
