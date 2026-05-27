require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/error");

connectDB();
const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xss());
app.use(morgan("dev"));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

app.get("/", (_, res) => res.json({ message: "🌾 Farm to Home API" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || "*" } });

const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("user:online", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("users:online", Array.from(onlineUsers.keys()));
  });

  socket.on("chat:join", (chatId) => socket.join(chatId));

  socket.on("chat:message", ({ chatId, message, receiverId }) => {
    io.to(chatId).emit("chat:message", message);
    if (receiverId && onlineUsers.has(receiverId)) {
      io.to(onlineUsers.get(receiverId)).emit("chat:notification", { chatId, message });
    }
  });

  socket.on("disconnect", () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) onlineUsers.delete(uid);
    }
    io.emit("users:online", Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
