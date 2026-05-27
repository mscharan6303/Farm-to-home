const router = require("express").Router();
const { protect } = require("../middleware/auth");
const c = require("../controllers/reviewController");

router.post("/", protect, c.createReview);
router.get("/:productId", c.getReviews);

module.exports = router;
