import axios from "axios";
import { mockProducts, mockOrders } from "./mockData";
import { getAllSyncedOrders } from "./cloudSync";

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return "http://localhost:5000/api";
    }
    return `${origin}/api`;
  }
  return "/api";
};

const api = axios.create({
  baseURL: getApiBase(),
  timeout: 1500,
});

function handleMockProducts(url) {
  const singleMatch = url.match(/\/products\/([a-f0-9]{24}|prod_\d+|[a-zA-Z0-9_-]+)$/);
  if (singleMatch) {
    const id = singleMatch[1];
    const product = mockProducts.find((p) => p._id === id || p.publicId === id) || mockProducts[0];
    return { data: product };
  }

  if (url.includes("/farmer/mine")) {
    return { data: mockProducts.slice(0, 5) };
  }

  const queryString = url.includes("?") ? url.split("?")[1] : "";
  const params = new URLSearchParams(queryString);
  const category = params.get("category");
  const keyword = params.get("keyword");
  const page = parseInt(params.get("page") || "1");
  const limit = parseInt(params.get("limit") || "12");

  let filtered = [...mockProducts];

  if (category && category !== "All") {
    filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw) ||
        p.category.toLowerCase().includes(kw)
    );
  }

  const total = filtered.length;
  const pages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const pageProducts = filtered.slice(startIndex, startIndex + limit);

  return {
    data: {
      products: pageProducts,
      page,
      pages,
      total,
    },
  };
}

export async function getLocalFarmerOrders() {
  return await getAllSyncedOrders();
}

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  async (r) => {
    if (r.config?.url?.includes("/products")) {
      if (r.data && Array.isArray(r.data.products) && r.data.products.length === 0) {
        return handleMockProducts(r.config.url);
      }
    }
    if (r.config?.url?.includes("/orders/farmer/received")) {
      if (!Array.isArray(r.data) || r.data.length === 0) {
        const local = await getLocalFarmerOrders();
        if (local.length > 0) return { ...r, data: local };
      }
    }
    if (r.config?.url?.includes("/orders/myorders")) {
      if (!Array.isArray(r.data) || r.data.length === 0) {
        const local = await getAllSyncedOrders();
        if (local.length > 0) return { ...r, data: local };
      }
    }
    return r;
  },
  async (err) => {
    if (err.config?.url?.includes("/products")) {
      return Promise.resolve(handleMockProducts(err.config.url));
    }
    if (err.config?.url?.includes("/orders/farmer/received")) {
      const local = await getLocalFarmerOrders();
      return Promise.resolve({ data: local });
    }
    if (err.config?.url?.includes("/orders/myorders")) {
      const local = await getAllSyncedOrders();
      return Promise.resolve({ data: local });
    }
    return Promise.reject(err);
  }
);

export default api;
