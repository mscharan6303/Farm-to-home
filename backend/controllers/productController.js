const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const { cloudinary } = require("../config/cloudinary");

// GET /api/products
exports.getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, organic, sort, page = 1, limit = 12 } = req.query;
  const filter = {};
  if (keyword) filter.$text = { $search: keyword };
  if (category) filter.category = category;
  if (organic === "true") filter.organic = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  let sortObj = { createdAt: -1 };
  if (sort === "price_asc") sortObj = { price: 1 };
  if (sort === "price_desc") sortObj = { price: -1 };
  if (sort === "best_selling") sortObj = { sold: -1 };
  if (sort === "rating") sortObj = { rating: -1 };

  const count = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("farmer", "name farmName verified")
    .sort(sortObj)
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));
  res.json({ products, page: Number(page), pages: Math.ceil(count / limit), total: count });
});

// GET /api/products/:id
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("farmer", "name farmName phone profileImage verified");
  if (!product) { res.status(404); throw new Error("Product not found"); }
  res.json(product);
});

// POST /api/products  (farmer)
exports.createProduct = asyncHandler(async (req, res) => {
  const images = (req.files || []).map((f) => ({ url: f.path, publicId: f.filename }));
  const product = await Product.create({
    ...req.body,
    price: Number(req.body.price),
    stock: Number(req.body.stock),
    discountPrice: Number(req.body.discountPrice || 0),
    organic: req.body.organic === "true" || req.body.organic === true,
    seasonal: req.body.seasonal === "true" || req.body.seasonal === true,
    images,
    farmer: req.user._id,
  });
  res.status(201).json(product);
});

// PUT /api/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error("Product not found"); }
  if (product.farmer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403); throw new Error("Not authorized");
  }
  Object.assign(product, req.body);
  if (req.files?.length) {
    const newImgs = req.files.map((f) => ({ url: f.path, publicId: f.filename }));
    product.images.push(...newImgs);
  }
  await product.save();
  res.json(product);
});

// DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error("Product not found"); }
  if (product.farmer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403); throw new Error("Not authorized");
  }
  for (const img of product.images) {
    if (img.publicId) await cloudinary.uploader.destroy(img.publicId).catch(() => {});
  }
  await product.deleteOne();
  res.json({ message: "Product removed" });
});

// GET /api/products/farmer/mine
exports.getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ farmer: req.user._id }).sort({ createdAt: -1 });
  res.json(products);
});
