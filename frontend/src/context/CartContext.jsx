import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";
import { mockProducts } from "../services/mockData";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem("cart");
      return stored ? JSON.parse(stored) : { items: [] };
    } catch {
      return { items: [] };
    }
  });

  const saveLocalCart = (cartData) => {
    try {
      localStorage.setItem("cart", JSON.stringify(cartData));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  };

  const fetchCart = async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/cart", { timeout: 3000 });
      if (data && Array.isArray(data.items)) {
        setCart(data);
        saveLocalCart(data);
      }
    } catch (err) {
      console.warn("Using local cached cart:", err.message);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  // OPTIMISTIC INSTANT ADD TO CART (0ms response time!)
  const addToCart = (productOrId, quantity = 1) => {
    let targetProduct = null;
    let productId = productOrId;

    if (typeof productOrId === "object" && productOrId !== null) {
      targetProduct = productOrId;
      productId = productOrId._id || productOrId.id;
    } else {
      targetProduct = mockProducts.find((p) => p._id === productId || p.id === productId);
    }

    // 1. Instant local state update
    setCart((prevCart) => {
      const currentItems = Array.isArray(prevCart?.items) ? [...prevCart.items] : [];
      const existingIndex = currentItems.findIndex((i) => {
        const pId = typeof i.product === "object" ? (i.product._id || i.product.id) : i.product;
        return pId === productId;
      });

      if (existingIndex > -1) {
        currentItems[existingIndex] = {
          ...currentItems[existingIndex],
          quantity: currentItems[existingIndex].quantity + quantity,
        };
      } else {
        currentItems.push({
          _id: "cart_item_" + Date.now(),
          product: targetProduct || {
            _id: productId,
            name: "Fresh Farm Product",
            price: 50,
            discountPrice: 45,
            unit: "kg",
            images: [{ url: "https://placehold.co/400" }],
          },
          quantity: quantity,
        });
      }

      const newCart = { ...prevCart, items: currentItems };
      saveLocalCart(newCart);
      return newCart;
    });

    toast.success("Added to cart! 🛒", { id: "cart-toast" });

    // 2. Async non-blocking background sync
    if (user) {
      api.post("/cart/add", { productId, quantity }, { timeout: 2500 })
        .then(({ data }) => {
          if (data && Array.isArray(data.items)) {
            setCart(data);
            saveLocalCart(data);
          }
        })
        .catch(() => { /* quiet fallback */ });
    }
  };

  // OPTIMISTIC INSTANT QUANTITY UPDATE (0ms response time!)
  const updateQty = (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);

    setCart((prevCart) => {
      const currentItems = Array.isArray(prevCart?.items) ? [...prevCart.items] : [];
      const index = currentItems.findIndex((i) => {
        const pId = typeof i.product === "object" ? (i.product._id || i.product.id) : i.product;
        return pId === productId;
      });

      if (index > -1) {
        currentItems[index] = { ...currentItems[index], quantity };
      }
      const newCart = { ...prevCart, items: currentItems };
      saveLocalCart(newCart);
      return newCart;
    });

    if (user) {
      api.put("/cart/update", { productId, quantity }, { timeout: 2500 })
        .then(({ data }) => {
          if (data && Array.isArray(data.items)) {
            setCart(data);
            saveLocalCart(data);
          }
        })
        .catch(() => { /* quiet fallback */ });
    }
  };

  // OPTIMISTIC INSTANT REMOVE FROM CART (0ms response time!)
  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const currentItems = Array.isArray(prevCart?.items) ? [...prevCart.items] : [];
      const filtered = currentItems.filter((i) => {
        const pId = typeof i.product === "object" ? (i.product._id || i.product.id) : i.product;
        return pId !== productId;
      });
      const newCart = { ...prevCart, items: filtered };
      saveLocalCart(newCart);
      return newCart;
    });

    toast.success("Item removed", { id: "cart-toast-remove" });

    if (user) {
      api.delete(`/cart/remove/${productId}`, { timeout: 2500 })
        .then(({ data }) => {
          if (data && Array.isArray(data.items)) {
            setCart(data);
            saveLocalCart(data);
          }
        })
        .catch(() => { /* quiet fallback */ });
    }
  };

  const clearCart = async () => {
    const emptyCart = { items: [] };
    setCart(emptyCart);
    saveLocalCart(emptyCart);

    if (user) {
      try {
        await api.delete("/cart", { timeout: 2500 });
      } catch { /* quiet fallback */ }
    }
  };

  const subtotal = (cart?.items || []).reduce((s, i) => {
    const p = i.product;
    if (!p) return s;
    const price = p.discountPrice > 0 ? p.discountPrice : p.price;
    return s + (price || 0) * (i.quantity || 1);
  }, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateQty, removeFromCart, clearCart, fetchCart, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}
