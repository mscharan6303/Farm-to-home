const router = require("express").Router();
const { protect } = require("../middleware/auth");
const c = require("../controllers/chatController");

router.get("/", protect, c.getChats);
router.post("/", protect, c.openChat);
router.get("/:chatId/messages", protect, c.getMessages);
router.post("/message", protect, c.sendMessage);

module.exports = router;
