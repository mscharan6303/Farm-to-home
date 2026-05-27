const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const c = require("../controllers/productController");

router.get("/", c.getProducts);
router.get("/farmer/mine", protect, authorize("farmer", "admin"), c.getMyProducts);
router.get("/:id", c.getProduct);
router.post("/", protect, authorize("farmer", "admin"), upload.array("images", 5), c.createProduct);
router.put("/:id", protect, authorize("farmer", "admin"), upload.array("images", 5), c.updateProduct);
router.delete("/:id", protect, authorize("farmer", "admin"), c.deleteProduct);

module.exports = router;
