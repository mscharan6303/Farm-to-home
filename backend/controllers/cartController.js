const asyncHandler = require("express-async-handler");
const Cart = require("../models/Cart");

// GET /api/cart
exports.getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  res.json(cart || { user: req.user._id, items: [] });
});

// POST /api/cart/add  { productId, quantity }
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  const idx = cart.items.findIndex((i) => i.product.toString() === productId);
  if (idx > -1) cart.items[idx].quantity += Number(quantity);
  else cart.items.push({ product: productId, quantity });
  await cart.save();
  await cart.populate("items.product");
  res.json(cart);
});

// PUT /api/cart/update  { productId, quantity }
exports.updateCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) { res.status(404); throw new Error("Cart not found"); }
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (item) item.quantity = Number(quantity);
  await cart.save();
  await cart.populate("items.product");
  res.json(cart);
});

// DELETE /api/cart/remove/:id
exports.removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) { res.status(404); throw new Error("Cart not found"); }
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.id);
  await cart.save();
  await cart.populate("items.product");
  res.json(cart);
});

// DELETE /api/cart
exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.json({ message: "Cart cleared" });
});
