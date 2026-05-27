const router = require("express").Router();
const { protect } = require("../middleware/auth");
const c = require("../controllers/paymentController");

router.post("/create", protect, c.createPayment);
router.post("/verify", protect, c.verifyPayment);

module.exports = router;
