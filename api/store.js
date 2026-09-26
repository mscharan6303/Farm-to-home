let store = {
  orders: [],
  statusOverrides: {}
};

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "POST" || req.method === "PUT") {
    let body = req.body || {};
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch(e) {}
    }
    const data = body.data || body;
    if (data.newOrder && data.newOrder._id) {
      const idx = store.orders.findIndex(o => o._id === data.newOrder._id);
      if (idx >= 0) {
        store.orders[idx] = { ...store.orders[idx], ...data.newOrder };
      } else {
        store.orders.unshift(data.newOrder);
      }
    } else if (data.orderId && data.status) {
      store.statusOverrides[data.orderId] = data.status;
      store.orders = store.orders.map(o => o._id === data.orderId ? { ...o, status: data.status } : o);
    } else if (Array.isArray(data.orders)) {
      const orderMap = new Map();
      store.orders.forEach(o => orderMap.set(o._id, o));
      data.orders.forEach(o => orderMap.set(o._id, o));
      store.orders = Array.from(orderMap.values());
      store.statusOverrides = { ...store.statusOverrides, ...(data.statusOverrides || {}) };
    }
    return res.status(200).json({ success: true, data: store });
  }

  res.status(200).json({ success: true, data: store });
}
