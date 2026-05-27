const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Vegetables", "Fruits", "Leafy Vegetables", "Dairy", "Grains", "Organic Products"],
    },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    unit: { type: String, default: "kg" },
    images: [{ url: String, publicId: String }],
    organic: { type: Boolean, default: false },
    seasonal: { type: Boolean, default: false },
    nutrition: { type: String, default: "" },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", category: "text" });

module.exports = mongoose.model("Product", productSchema);
