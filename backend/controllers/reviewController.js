const asyncHandler = require("express-async-handler");
const Review = require("../models/Review");
const Product = require("../models/Product");

// POST /api/reviews  { productId, rating, comment }
exports.createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment, images } = req.body;
  const product = await Product.findById(productId);
  if (!product) { res.status(404); throw new Error("Product not found"); }
  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) { res.status(400); throw new Error("Already reviewed"); }
  await Review.create({
    product: productId, user: req.user._id, name: req.user.name,
    rating: Number(rating), comment, images: images || [],
  });
  const reviews = await Review.find({ product: productId });
  product.numReviews = reviews.length;
  product.rating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await product.save();
  res.status(201).json({ message: "Review added" });
});

// GET /api/reviews/:productId
exports.getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate("user", "name profileImage")
    .sort({ createdAt: -1 });
  res.json(reviews);
});
