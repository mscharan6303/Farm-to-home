const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
let razorpay = null;
try {
  const Razorpay = require("razorpay");
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch {}

// POST /api/payment/create  { amount }  -> razorpay order
exports.createPayment = asyncHandler(async (req, res) => {
  if (!razorpay) { res.status(503); throw new Error("Razorpay not configured"); }
  const { amount } = req.body;
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: `r_${Date.now()}`,
  });
  res.json({ orderId: order.id, amount: order.amount, key: process.env.RAZORPAY_KEY_ID });
});

// POST /api/payment/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const sign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (sign !== razorpay_signature) { res.status(400); throw new Error("Invalid signature"); }
  res.json({ success: true, paymentId: razorpay_payment_id });
});
