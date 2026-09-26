import axios from "axios";
import { mockOrders } from "./mockData";

const getCloudStoreUrl = () => {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return "http://localhost:5000/api/store";
    }
    return `${origin}/api/store`;
  }
  return "/api/store";
};

// BroadcastChannel for instant multi-tab communication in the same browser
const syncChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("farm_to_home_orders") : null;

export function notifySyncListeners() {
  try {
    syncChannel?.postMessage({ type: "SYNC_EVENT", timestamp: Date.now() });
    window.dispatchEvent(new CustomEvent("farm_to_home_sync", { detail: { timestamp: Date.now() } }));
  } catch (e) {}
}

export function fetchCloudStore() {
  let cached = { orders: [], statusOverrides: {}, paymentOverrides: {} };
  try {
    const localStr = localStorage.getItem("cached_cloud_store");
    if (localStr) cached = JSON.parse(localStr);
  } catch (e) {}

  // Background non-blocking sync with backend server
  try {
    const url = getCloudStoreUrl();
    axios.get(url, { timeout: 1500 }).then(({ data }) => {
      const remoteData = data?.data || data;
      if (remoteData && typeof remoteData === "object" && Array.isArray(remoteData.orders)) {
        const remoteOrders = remoteData.orders;
        const remoteOverrides = remoteData.statusOverrides || {};
        const remotePaymentOverrides = remoteData.paymentOverrides || {};

        const mergedOrdersMap = new Map();
        (cached.orders || []).forEach(o => mergedOrdersMap.set(o._id, o));
        remoteOrders.forEach(o => mergedOrdersMap.set(o._id, o));

        const mergedStore = {
          orders: Array.from(mergedOrdersMap.values()),
          statusOverrides: { ...(cached.statusOverrides || {}), ...remoteOverrides },
          paymentOverrides: { ...(cached.paymentOverrides || {}), ...remotePaymentOverrides }
        };

        try {
          const prevStr = localStorage.getItem("cached_cloud_store");
          const nextStr = JSON.stringify(mergedStore);
          localStorage.setItem("cached_cloud_store", nextStr);
          if (prevStr !== nextStr) {
            notifySyncListeners();
          }
        } catch (e) {}
      }
    }).catch(() => {});
  } catch (e) {}

  return cached;
}

export function saveCloudStore(storeData) {
  try {
    localStorage.setItem("cached_cloud_store", JSON.stringify(storeData));
  } catch (e) {}

  try {
    const url = getCloudStoreUrl();
    axios.post(url, { data: storeData }, { timeout: 1500 }).catch(() => {});
  } catch (e) {}
}

export function syncOrder(newOrder) {
  if (!newOrder || !newOrder._id) return;

  // 1. Update in-memory mockOrders instantly
  const mockIdx = mockOrders.findIndex((o) => o._id === newOrder._id);
  if (mockIdx >= 0) {
    mockOrders[mockIdx] = { ...mockOrders[mockIdx], ...newOrder };
  } else {
    mockOrders.unshift(newOrder);
  }

  // 2. Persist in all_local_orders
  try {
    let allLocal = JSON.parse(localStorage.getItem("all_local_orders") || "[]");
    const idx = allLocal.findIndex((o) => o._id === newOrder._id);
    if (idx >= 0) {
      allLocal[idx] = { ...allLocal[idx], ...newOrder };
    } else {
      allLocal.unshift(newOrder);
    }
    localStorage.setItem("all_local_orders", JSON.stringify(allLocal));
  } catch (e) {}

  // 3. Update full cloud store cache
  try {
    const store = fetchCloudStore();
    let orders = Array.isArray(store.orders) ? [...store.orders] : [];
    const index = orders.findIndex((o) => o._id === newOrder._id);
    if (index >= 0) {
      orders[index] = { ...orders[index], ...newOrder };
    } else {
      orders.unshift(newOrder);
    }
    store.orders = orders;
    saveCloudStore(store);
  } catch (e) {}

  // 4. Send background server POST
  try {
    const url = getCloudStoreUrl();
    axios.post(url, { data: { newOrder } }, { timeout: 1500 }).catch(() => {});
  } catch (e) {}

  // 5. Broadcast event across tabs instantly
  notifySyncListeners();
}

export function syncStatus(orderId, newStatus) {
  if (!orderId || !newStatus) return;

  // 1. Update in-memory mockOrders
  const mOrder = mockOrders.find((o) => o._id === orderId);
  if (mOrder) mOrder.status = newStatus;

  // 2. Persist status override locally
  let localOverrides = {};
  try {
    localOverrides = JSON.parse(localStorage.getItem("farmer_order_status_overrides") || "{}");
    localOverrides[orderId] = newStatus;
    localStorage.setItem("farmer_order_status_overrides", JSON.stringify(localOverrides));
  } catch (e) {}

  // 3. Update in all_local_orders
  try {
    let allLocal = JSON.parse(localStorage.getItem("all_local_orders") || "[]");
    allLocal = allLocal.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o));
    localStorage.setItem("all_local_orders", JSON.stringify(allLocal));
  } catch (e) {}

  // 4. Update in local_orders_*
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("local_orders_")) {
      try {
        let userOrders = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(userOrders)) {
          let updated = userOrders.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o));
          localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch (e) {}
    }
  });

  // 5. Update full cloud store cache
  try {
    const store = fetchCloudStore();
    let overrides = store.statusOverrides || {};
    overrides[orderId] = newStatus;

    let orders = Array.isArray(store.orders) ? [...store.orders] : [];
    orders = orders.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o));

    store.statusOverrides = overrides;
    store.orders = orders;
    saveCloudStore(store);
  } catch (e) {}

  // 6. Send background server PUT
  try {
    const url = getCloudStoreUrl();
    axios.post(url, { data: { orderId, status: newStatus } }, { timeout: 1500 }).catch(() => {});
  } catch (e) {}

  // 7. Broadcast event across tabs
  notifySyncListeners();
}

export function syncPayment(orderId, isPaid) {
  if (!orderId) return;

  // 1. Update in-memory mockOrders
  const mOrder = mockOrders.find((o) => o._id === orderId);
  if (mOrder) mOrder.isPaid = isPaid;

  // 2. Persist payment override locally
  let localOverrides = {};
  try {
    localOverrides = JSON.parse(localStorage.getItem("farmer_order_payment_overrides") || "{}");
    localOverrides[orderId] = isPaid;
    localStorage.setItem("farmer_order_payment_overrides", JSON.stringify(localOverrides));
  } catch (e) {}

  // 3. Update in all_local_orders
  try {
    let allLocal = JSON.parse(localStorage.getItem("all_local_orders") || "[]");
    allLocal = allLocal.map((o) => (o._id === orderId ? { ...o, isPaid } : o));
    localStorage.setItem("all_local_orders", JSON.stringify(allLocal));
  } catch (e) {}

  // 4. Update in local_orders_*
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("local_orders_")) {
      try {
        let userOrders = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(userOrders)) {
          let updated = userOrders.map((o) => (o._id === orderId ? { ...o, isPaid } : o));
          localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch (e) {}
    }
  });

  // 5. Update full cloud store cache
  try {
    const store = fetchCloudStore();
    let paymentOverrides = store.paymentOverrides || {};
    paymentOverrides[orderId] = isPaid;

    let orders = Array.isArray(store.orders) ? [...store.orders] : [];
    orders = orders.map((o) => (o._id === orderId ? { ...o, isPaid } : o));

    store.paymentOverrides = paymentOverrides;
    store.orders = orders;
    saveCloudStore(store);
  } catch (e) {}

  // 6. Send background server POST
  try {
    const url = getCloudStoreUrl();
    axios.post(url, { data: { orderId, isPaid } }, { timeout: 1500 }).catch(() => {});
  } catch (e) {}

  // 7. Broadcast event across tabs
  notifySyncListeners();
}

export function syncAgent(orderId, agentInfo) {
  if (!orderId || !agentInfo) return;

  // 1. Update mockOrders
  const mOrder = mockOrders.find((o) => o._id === orderId);
  if (mOrder) mOrder.deliveryAgent = agentInfo;

  // 2. Persist agent override locally
  let localOverrides = {};
  try {
    localOverrides = JSON.parse(localStorage.getItem("farmer_order_agent_overrides") || "{}");
    localOverrides[orderId] = agentInfo;
    localStorage.setItem("farmer_order_agent_overrides", JSON.stringify(localOverrides));
  } catch (e) {}

  // 3. Update in all_local_orders
  try {
    let allLocal = JSON.parse(localStorage.getItem("all_local_orders") || "[]");
    allLocal = allLocal.map((o) => (o._id === orderId ? { ...o, deliveryAgent: agentInfo } : o));
    localStorage.setItem("all_local_orders", JSON.stringify(allLocal));
  } catch (e) {}

  // 4. Broadcast event across tabs
  notifySyncListeners();
}

export async function getAllSyncedOrders() {
  let store = { orders: [], statusOverrides: {}, paymentOverrides: {}, agentOverrides: {} };
  try {
    const localStr = localStorage.getItem("cached_cloud_store");
    if (localStr) store = JSON.parse(localStr);
  } catch (e) {}

  try {
    const url = getCloudStoreUrl();
    const res = await axios.get(url, { timeout: 1500 }).catch(() => null);
    const remoteData = res?.data?.data || res?.data;
    if (remoteData && typeof remoteData === "object" && Array.isArray(remoteData.orders)) {
      const remoteOrders = remoteData.orders;
      const remoteOverrides = remoteData.statusOverrides || {};
      const remotePaymentOverrides = remoteData.paymentOverrides || {};

      const mergedOrdersMap = new Map();
      (store.orders || []).forEach(o => mergedOrdersMap.set(o._id, o));
      remoteOrders.forEach(o => mergedOrdersMap.set(o._id, o));

      store = {
        orders: Array.from(mergedOrdersMap.values()),
        statusOverrides: { ...(store.statusOverrides || {}), ...remoteOverrides },
        paymentOverrides: { ...(store.paymentOverrides || {}), ...remotePaymentOverrides }
      };

      try {
        localStorage.setItem("cached_cloud_store", JSON.stringify(store));
      } catch (e) {}
    }
  } catch (err) {}

  const cloudOrders = Array.isArray(store.orders) ? store.orders : [];

  let localStatusOverrides = {};
  let localPaymentOverrides = {};
  let localAgentOverrides = {};
  try {
    localStatusOverrides = JSON.parse(localStorage.getItem("farmer_order_status_overrides") || "{}");
    localPaymentOverrides = JSON.parse(localStorage.getItem("farmer_order_payment_overrides") || "{}");
    localAgentOverrides = JSON.parse(localStorage.getItem("farmer_order_agent_overrides") || "{}");
  } catch (e) {}

  const statusOverrides = { ...store.statusOverrides, ...localStatusOverrides };
  const paymentOverrides = { ...store.paymentOverrides, ...localPaymentOverrides };
  const agentOverrides = { ...(store.agentOverrides || {}), ...localAgentOverrides };

  const combinedOrders = [];
  const seenIds = new Set();

  const addOrders = (arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((o) => {
      if (o && o._id && !seenIds.has(o._id)) {
        seenIds.add(o._id);
        const orderCopy = { ...o };
        if (statusOverrides[orderCopy._id]) {
          orderCopy.status = statusOverrides[orderCopy._id];
        }
        if (paymentOverrides[orderCopy._id] !== undefined) {
          orderCopy.isPaid = paymentOverrides[orderCopy._id];
        }
        if (agentOverrides[orderCopy._id]) {
          orderCopy.deliveryAgent = agentOverrides[orderCopy._id];
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

export function subscribeToSyncEvents(callback) {
  const handleStorage = () => callback();
  const handleCustom = () => callback();

  window.addEventListener("storage", handleStorage);
  window.addEventListener("farm_to_home_sync", handleCustom);

  let channelListener = null;
  if (syncChannel) {
    channelListener = () => callback();
    syncChannel.addEventListener("message", channelListener);
  }

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("farm_to_home_sync", handleCustom);
    if (syncChannel && channelListener) {
      syncChannel.removeEventListener("message", channelListener);
    }
  };
}
