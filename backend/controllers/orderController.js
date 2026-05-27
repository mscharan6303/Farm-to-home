const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

// POST /api/orders
exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, itemsPrice, deliveryCharge, discount, totalPrice } = req.body;
  if (!items?.length) { res.status(400); throw new Error("No order items"); }

  // hydrate items with farmer ids
  const hydrated = await Promise.all(items.map(async (i) => {
    const p = await Product.findById(i.product);
    if (!p) throw new Error(`Product ${i.product} not found`);
    if (p.stock < i.quantity) throw new Error(`Insufficient stock for ${p.name}`);
    p.stock -= i.quantity;
    p.sold += i.quantity;
    await p.save();
    return {
      product: p._id, name: p.name, image: p.images[0]?.url || "",
      price: p.discountPrice > 0 ? p.discountPrice : p.price,
      quantity: i.quantity, farmer: p.farmer,
    };
  }));

  const order = await Order.create({
    user: req.user._id, items: hydrated, shippingAddress,
    paymentMethod: paymentMethod || "COD",
    itemsPrice, deliveryCharge, discount, totalPrice,
  });

  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.status(201).json(order);
});

// GET /api/orders/myorders
exports.myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/:id
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) { res.status(404); throw new Error("Order not found"); }
  res.json(order);
});

// GET /api/orders/farmer/received  (farmer)
exports.farmerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ "items.farmer": req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// PUT /api/orders/status/:id
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error("Order not found"); }
  order.status = status;
  if (status === "Delivered") { order.deliveredAt = new Date(); order.isPaid = true; order.paidAt = new Date(); }
  await order.save();
  res.json(order);
});

// GET /api/orders  (admin)
exports.allOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
  res.json(orders);
});
