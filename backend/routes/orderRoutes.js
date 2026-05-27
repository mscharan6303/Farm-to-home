const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const c = require("../controllers/orderController");

router.post("/", protect, c.createOrder);
router.get("/myorders", protect, c.myOrders);
router.get("/farmer/received", protect, authorize("farmer", "admin"), c.farmerOrders);
router.get("/", protect, authorize("admin"), c.allOrders);
router.get("/:id", protect, c.getOrder);
router.put("/status/:id", protect, authorize("farmer", "admin"), c.updateStatus);

module.exports = router;
