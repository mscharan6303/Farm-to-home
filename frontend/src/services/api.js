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
    const url = err.config?.url;
    
    // Fallback for getting products on ANY error (including 404s from missing backend)
    if (url && err.config.method?.toLowerCase() === "get" && url.includes("/products")) {
      console.warn("Backend unavailable or returning error, using mock data for products.");
      
      // Single product fallback
      const singleProductMatch = url.match(/\/products\/([a-zA-Z0-9_-]+)(?:\?.*)?$/);
      if (singleProductMatch && singleProductMatch[1]) {
        const id = singleProductMatch[1];
        const product = mockProducts.find(p => p._id === id) || mockProducts[0];
        return Promise.resolve({ data: product });
      }
      
      // All products fallback
      let filteredProducts = [...mockProducts];
      try {
        // err.config.url might be relative like "/products?category=Fruits"
        const fakeUrl = new URL(url, 'http://dummy.com');
        const category = fakeUrl.searchParams.get('category');
        const keyword = fakeUrl.searchParams.get('keyword');
        
        if (category && category !== 'All') {
          filteredProducts = filteredProducts.filter(p => p.category === category);
        }
        if (keyword) {
          const kw = keyword.toLowerCase();
          filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(kw) || 
            p.description.toLowerCase().includes(kw)
          );
        }
      } catch (e) {
        console.error("Error applying filters to mock data:", e);
      }

      return Promise.resolve({ 
        data: { 
          products: filteredProducts, 
          page: 1, 
          pages: 1, 
          total: filteredProducts.length 
        } 
      });
    }

    // Fallback for Auth Login
    if (url && err.config.method?.toLowerCase() === "post" && url.includes("/auth/login")) {
      console.warn("Backend unavailable, using mock auth data.");
      try {
        const reqBody = JSON.parse(err.config.data);
        if (reqBody.email === "testuser@example.com" && reqBody.password === "password123") {
          return Promise.resolve({
            data: {
              _id: "mock_user_1",
              name: "Test User",
              email: "testuser@example.com",
              role: "consumer",
              isPremium: false,
              token: "mock_jwt_token_consumer"
            }
          });
        }
        if (reqBody.email === "farmer@demo.com" && reqBody.password === "password123") {
          return Promise.resolve({
            data: {
              _id: "6a15b4b1d1e36502bed909c1",
              name: "Demo Farmer",
              email: "farmer@demo.com",
              role: "farmer",
              farmName: "Green Acres Demo Farm",
              token: "mock_jwt_token_farmer"
            }
          });
        }
        return Promise.reject({ response: { data: { message: "Invalid email or password" } } });
      } catch (e) {
        // ignore
      }
    }

    if (err.response?.status === 401) {
      // Optional: redirect to login
    }
    return Promise.reject(err);
  }
);

export default api;
