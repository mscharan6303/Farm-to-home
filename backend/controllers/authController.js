const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, address, role, profileImage, farmName } = req.body;
  if (!name || !email || !password || !phone) {
    res.status(400);
    throw new Error("Please provide name, email, phone and password");
  }
  if (await User.findOne({ email })) {
    res.status(400);
    throw new Error("User already exists");
  }
  const user = await User.create({
    name, email, phone, password, address,
    role: ["farmer", "consumer", "admin"].includes(role) ? role : "consumer",
    profileImage: profileImage || "",
    farmName: farmName || "",
  });
  res.status(201).json({
    _id: user._id, name: user.name, email: user.email, role: user.role,
    phone: user.phone, address: user.address, farmName: user.farmName,
    profileImage: user.profileImage, token: generateToken(user._id, user.role),
  });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  res.json({
    _id: user._id, name: user.name, email: user.email, role: user.role,
    phone: user.phone, address: user.address, farmName: user.farmName,
    profileImage: user.profileImage, token: generateToken(user._id, user.role),
  });
});

// GET /api/auth/profile
exports.getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error("User not found"); }
  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;
  user.address = req.body.address || user.address;
  user.profileImage = req.body.profileImage || user.profileImage;
  user.farmName = req.body.farmName || user.farmName;
  await user.save();
  res.json(user);
});
