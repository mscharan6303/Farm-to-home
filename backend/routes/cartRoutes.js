const router = require("express").Router();
const { protect } = require("../middleware/auth");
const c = require("../controllers/cartController");

router.get("/", protect, c.getCart);
router.post("/add", protect, c.addToCart);
router.put("/update", protect, c.updateCart);
router.delete("/remove/:id", protect, c.removeFromCart);
router.delete("/", protect, c.clearCart);

module.exports = router;
