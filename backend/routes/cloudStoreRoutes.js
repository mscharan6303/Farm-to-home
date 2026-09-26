const express = require("express");
const router = express.Router();

let globalCloudStore = {
  orders: [],
  statusOverrides: {}
};

// GET /api/cloud-store
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: globalCloudStore
  });
});

// PUT /api/cloud-store
router.put("/", (req, res) => {
  const { data } = req.body || {};
  if (data && typeof data === "object") {
    const newOrders = Array.isArray(data.orders) ? data.orders : [];
    const newOverrides = data.statusOverrides || {};

    const orderMap = new Map();
    globalCloudStore.orders.forEach(o => orderMap.set(o._id, o));
    newOrders.forEach(o => orderMap.set(o._id, o));

    globalCloudStore.orders = Array.from(orderMap.values());
    globalCloudStore.statusOverrides = {
      ...globalCloudStore.statusOverrides,
      ...newOverrides
    };
  }
  res.json({
    success: true,
    data: globalCloudStore
  });
});

// POST /api/cloud-store/order
router.post("/order", (req, res) => {
  const newOrder = req.body;
  if (newOrder && newOrder._id) {
    const idx = globalCloudStore.orders.findIndex(o => o._id === newOrder._id);
    if (idx >= 0) {
      globalCloudStore.orders[idx] = { ...globalCloudStore.orders[idx], ...newOrder };
    } else {
      globalCloudStore.orders.unshift(newOrder);
    }
  }
  res.json({
    success: true,
    data: globalCloudStore
  });
});

// PUT /api/cloud-store/status
router.put("/status", (req, res) => {
  const { orderId, status } = req.body;
  if (orderId && status) {
    globalCloudStore.statusOverrides[orderId] = status;
    globalCloudStore.orders = globalCloudStore.orders.map(o =>
      o._id === orderId ? { ...o, status } : o
    );
  }
  res.json({
    success: true,
    data: globalCloudStore
  });
});

module.exports = router;
