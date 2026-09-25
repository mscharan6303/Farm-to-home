const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/error");
const { startMarketUpdater } = require("./utils/marketUpdater");

connectDB();
const app = express();

if (!process.env.VERCEL) {
  startMarketUpdater();
}

app.use(async (req, res, next) => {
  if (mongoose.connection.readyState < 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error("DB Connection Middleware Error:", err.message);
    }
  }
  next();
});



app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
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


app.use("/api/chat", require("./routes/chatRoutes"));

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: true } });

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

  socket.on("order:status_update", ({ userId, orderId, status }) => {
    if (userId && onlineUsers.has(userId)) {
      io.to(onlineUsers.get(userId)).emit("order:notification", { orderId, status });
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
if (process.env.NODE_ENV !== "production") {
  server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
}

module.exports = app;

