import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });

  const fetchCart = async () => {
    if (!user) { setCart({ items: [] }); return; }
    try {
      const { data } = await api.get("/cart");
      setCart(data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchCart(); }, [user]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user) return toast.error("Please login first");
    const { data } = await api.post("/cart/add", { productId, quantity });
    setCart(data);
    toast.success("Added to cart");
  };

  const updateQty = async (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);
    const { data } = await api.put("/cart/update", { productId, quantity });
    setCart(data);
  };

  const removeFromCart = async (productId) => {
    const { data } = await api.delete(`/cart/remove/${productId}`);
    setCart(data);
  };

  const clearCart = async () => {
    await api.delete("/cart");
    setCart({ items: [] });
  };

  const subtotal = cart.items.reduce((s, i) => {
    const p = i.product;
    if (!p) return s;
    const price = p.discountPrice > 0 ? p.discountPrice : p.price;
    return s + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, removeFromCart, clearCart, fetchCart, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}
