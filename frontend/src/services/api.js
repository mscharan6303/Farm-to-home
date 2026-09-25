import axios from "axios";
import { mockProducts } from "./mockData";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: apiBase,
  timeout: 8000,
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

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => {
    if (r.config?.url?.includes("/products")) {
      if (r.data && Array.isArray(r.data.products) && r.data.products.length === 0) {
        return handleMockProducts(r.config.url);
      }
    }
    return r;
  },
  (err) => {
    if (err.config?.url?.includes("/products")) {
      return Promise.resolve(handleMockProducts(err.config.url));
    }
    return Promise.reject(err);
  }
);

export default api;
