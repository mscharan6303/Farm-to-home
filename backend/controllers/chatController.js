const asyncHandler = require("express-async-handler");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

// GET /api/chat  - list user's chats
exports.getChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id })
    .populate("participants", "name profileImage role")
    .sort({ lastMessageAt: -1 });
  res.json(chats);
});

// POST /api/chat  { userId }  - get or create chat
exports.openChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  let chat = await Chat.findOne({ participants: { $all: [req.user._id, userId] } });
  if (!chat) chat = await Chat.create({ participants: [req.user._id, userId] });
  await chat.populate("participants", "name profileImage role");
  res.json(chat);
});

// GET /api/chat/:chatId/messages
exports.getMessages = asyncHandler(async (req, res) => {
  const msgs = await Message.find({ chat: req.params.chatId }).sort({ createdAt: 1 });
  res.json(msgs);
});

// POST /api/chat/message  { chatId, text }
exports.sendMessage = asyncHandler(async (req, res) => {
  const { chatId, text } = req.body;
  const msg = await Message.create({ chat: chatId, sender: req.user._id, text });
  await Chat.findByIdAndUpdate(chatId, { lastMessage: text, lastMessageAt: new Date() });
  res.status(201).json(msg);
});
