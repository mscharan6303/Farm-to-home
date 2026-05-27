const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const c = require("../controllers/adminController");

router.use(protect, authorize("admin"));
router.get("/users", c.getUsers);
router.delete("/users/:id", c.deleteUser);
router.put("/users/:id/verify", c.verifyFarmer);
router.get("/analytics", c.analytics);

module.exports = router;
