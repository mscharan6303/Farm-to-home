import axios from "axios";
import { mockOrders } from "./mockData";

const CLOUD_STORE_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a0dce0227b1af0";

export async function fetchCloudStore() {
  try {
    const { data } = await axios.get(CLOUD_STORE_URL, { timeout: 4000 });
    return data?.data || { orders: [], statusOverrides: {} };
  } catch (err) {
    console.warn("Cloud store fetch fallback:", err);
    return { orders: [], statusOverrides: {} };
  }
}

export async function saveCloudStore(storeData) {
  try {
    await axios.put(
      CLOUD_STORE_URL,
      {
        name: "FarmToHome Orders Store",
        data: storeData
      },
      { timeout: 4000 }
    );
  } catch (err) {
    console.warn("Cloud store save fallback:", err);
  }
}

export async function syncOrder(newOrder) {
  if (!newOrder || !newOrder._id) return;
  try {
    const store = await fetchCloudStore();
    let orders = Array.isArray(store.orders) ? [...store.orders] : [];
    
    const index = orders.findIndex((o) => o._id === newOrder._id);
    if (index >= 0) {
      orders[index] = { ...orders[index], ...newOrder };
    } else {
      orders.unshift(newOrder);
    }

    store.orders = orders;
    await saveCloudStore(store);
  } catch (e) {
    console.warn("syncOrder failed:", e);
  }
}

export async function syncStatus(orderId, newStatus) {
  if (!orderId || !newStatus) return;
  try {
    const store = await fetchCloudStore();
    let overrides = store.statusOverrides || {};
    overrides[orderId] = newStatus;

    let orders = Array.isArray(store.orders) ? [...store.orders] : [];
    orders = orders.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o));

    store.statusOverrides = overrides;
    store.orders = orders;

    // Save locally as well
    try {
      const localOverrides = JSON.parse(localStorage.getItem("farmer_order_status_overrides") || "{}");
      localOverrides[orderId] = newStatus;
      localStorage.setItem("farmer_order_status_overrides", JSON.stringify(localOverrides));
    } catch (lErr) {}

    await saveCloudStore(store);
  } catch (e) {
    console.warn("syncStatus failed:", e);
  }
}

export async function getAllSyncedOrders() {
  const store = await fetchCloudStore();
  const cloudOrders = Array.isArray(store.orders) ? store.orders : [];

  let localOverrides = {};
  try {
    localOverrides = JSON.parse(localStorage.getItem("farmer_order_status_overrides") || "{}");
  } catch (e) {}

  const overrides = { ...store.statusOverrides, ...localOverrides };

  const combinedOrders = [];
  const seenIds = new Set();

  const addOrders = (arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((o) => {
      if (o && o._id && !seenIds.has(o._id)) {
        seenIds.add(o._id);
        const orderCopy = { ...o };
        if (overrides[orderCopy._id]) {
          orderCopy.status = overrides[orderCopy._id];
        }
        combinedOrders.push(orderCopy);
      }
    });
  };

  addOrders(cloudOrders);

  try {
    addOrders(JSON.parse(localStorage.getItem("all_local_orders") || "[]"));
  } catch (e) {}

  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith("local_orders_")) {
      try {
        addOrders(JSON.parse(localStorage.getItem(k) || "[]"));
      } catch (e) {}
    }
  });

  addOrders(mockOrders);

  return combinedOrders.sort(
    (a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())
  );
}
