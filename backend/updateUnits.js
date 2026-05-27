require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const connectDB = require('./config/db');

async function run() {
  await connectDB();
  const result = await Product.updateMany(
    { name: { $regex: /milk|doodh/i } },
    { $set: { unit: 'L' } }
  );
  console.log(`Updated ${result.modifiedCount} liquid products to Litres.`);
  process.exit();
}
run();
