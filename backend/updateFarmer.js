require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

async function run() {
  await connectDB();
  const rattaiah = await User.findOne({ email: 'rattaiah@gmail.com' });
  
  if (rattaiah) {
    // Just assign plain text; pre-save hook handles hashing
    rattaiah.password = '123456789';
    await rattaiah.save();
    console.log("Updated rattaiah's password correctly!");
  } else {
    console.log("Rattaiah not found!");
  }
  process.exit();
}
run();
