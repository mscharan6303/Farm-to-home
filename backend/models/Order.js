const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        image: String,
        price: Number,
        quantity: Number,
        farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "UPI", "Card", "Razorpay"],
      default: "COD",
    },
    paymentResult: {
      id: String,
      status: String,
      razorpayOrderId: String,
      razorpaySignature: String,
    },
    itemsPrice: Number,
    deliveryCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalPrice: Number,
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Pending",
    },
    deliveredAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
