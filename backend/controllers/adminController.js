const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

// GET /api/admin/users
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

// DELETE /api/admin/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User removed" });
});

// PUT /api/admin/users/:id/verify  (verify farmer)
exports.verifyFarmer = asyncHandler(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) { res.status(404); throw new Error("User not found"); }
  u.verified = !u.verified;
  await u.save();
  res.json(u);
});

// GET /api/admin/analytics
exports.analytics = asyncHandler(async (req, res) => {
  const [users, farmers, products, orders, revenueAgg, topProducts] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "farmer" }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: "$totalPrice" } } }]),
    Product.find().sort({ sold: -1 }).limit(5).select("name sold price"),
  ]);
  res.json({
    users, farmers, products, orders,
    revenue: revenueAgg[0]?.total || 0,
    topProducts,
  });
});
