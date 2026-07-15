import axios from "axios";
import { mockProducts } from "./mockData";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: apiBase,
  timeout: 8000, // 8 second timeout
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // If network error OR 5xx server error (Render asleep / Gateway Timeout)
    if (!err.response || err.code === "ERR_NETWORK" || err.response.status >= 500) {
      const url = err.config?.url;
      
      // Fallback for getting all products
      if (url && err.config.method === "get" && url.includes("/products")) {
        console.warn("Backend unavailable or timing out, using mock data for products.");
        
        // Single product fallback
        const singleProductMatch = url.match(/\/products\/([a-zA-Z0-9_-]+)(?:\?.*)?$/);
        if (singleProductMatch && singleProductMatch[1]) {
          const id = singleProductMatch[1];
          const product = mockProducts.find(p => p._id === id) || mockProducts[0];
          return Promise.resolve({ data: product });
        }
        
        // All products fallback
        return Promise.resolve({ 
          data: { 
            products: mockProducts, 
            page: 1, 
            pages: 1, 
            total: mockProducts.length 
          } 
        });
      }
    }

    if (err.response?.status === 401) {
      // Optional: redirect to login
    }
    return Promise.reject(err);
  }
);

export default api;
