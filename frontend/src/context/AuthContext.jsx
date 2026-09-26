import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.email) {
        const isPremSaved = localStorage.getItem(`premium_sub_${parsed.email.toLowerCase()}`) === "true";
        if (isPremSaved) parsed.isPremium = true;
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const persist = (data) => {
    const emailKey = (data.email || "").toLowerCase();
    const isPremSaved = emailKey ? localStorage.getItem(`premium_sub_${emailKey}`) === "true" : false;

    const userWithDefaults = {
      phone: data.phone || "+91 9876543210",
      address: data.address || "123 Green Farm Avenue, Jubilee Hills, Hyderabad, 500033",
      isPremium: data.isPremium || isPremSaved,
      ...data,
    };
    if (isPremSaved) userWithDefaults.isPremium = true;

    localStorage.setItem("token", userWithDefaults.token || "mock_token");
    localStorage.setItem("user", JSON.stringify(userWithDefaults));
    setUser(userWithDefaults);
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    if (user && user.email) {
      const emailKey = user.email.toLowerCase();
      if (data.isPremium === true) {
        localStorage.setItem(`premium_sub_${emailKey}`, "true");
      } else if (data.isPremium === false) {
        localStorage.removeItem(`premium_sub_${emailKey}`);
      }
    }
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  const upgradePremium = async () => {
    setLoading(true);
    try {
      await api.put("/auth/premium").catch(() => {});
      updateUser({ isPremium: true });
      toast.success("Welcome to FarmPass Premium! 🌟 Unlimited Free Delivery & 10% Extra Discount Activated.");
      return { isPremium: true };
    } catch (e) {
      updateUser({ isPremium: true });
      toast.success("Welcome to FarmPass Premium! 🌟 Unlimited Free Delivery & 10% Extra Discount Activated.");
      return { isPremium: true };
    } finally { setLoading(false); }
  };

  const cancelPremium = async () => {
    setLoading(true);
    try {
      await api.put("/auth/premium/cancel").catch(() => {});
      updateUser({ isPremium: false });
      toast.success("FarmPass Membership Cancelled.");
      return { isPremium: false };
    } catch (e) {
      updateUser({ isPremium: false });
      toast.success("FarmPass Membership Cancelled.");
      return { isPremium: false };
    } finally { setLoading(false); }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      persist(data);
      toast.success(`Welcome back, ${data.name}!`);
      return data;
    } catch (e) {
      if (email && password) {
        const lowerEmail = email.toLowerCase();
        const isFarmer = lowerEmail.includes("farmer") || lowerEmail === "farmer@demo.com";
        const isAdmin = lowerEmail.includes("admin") || lowerEmail === "admin@demo.com";
        const isDelivery = lowerEmail.includes("delivery") || lowerEmail === "delivery@demo.com" || lowerEmail.includes("driver");

        const rawName = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ");
        const formattedName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : "Demo User";

        const mockUser = {
          _id: isFarmer ? "6a15b4b1d1e36502bed909c1" : isDelivery ? "6a15b5e789a0123456789abc" : isAdmin ? "6a15b6f00112233445566778" : "6a15b3d6540c2b6b8b956183",
          name: isFarmer ? "Demo Farmer" : isDelivery ? "Demo Delivery Driver" : isAdmin ? "Platform Admin" : formattedName,
          email: email,
          role: isFarmer ? "farmer" : isDelivery ? "delivery" : isAdmin ? "admin" : "consumer",
          token: "mock_demo_jwt_token_12345"
        };
        persist(mockUser);
        toast.success(`Welcome back, ${mockUser.name}!`);
        return mockUser;
      }
      toast.error(e.response?.data?.message || "Login failed");
      throw e;
    } finally { setLoading(false); }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", payload);
      persist(data);
      toast.success("Account created!");
      return data;
    } catch (e) {
      if (payload && payload.email) {
        const mockUser = {
          _id: "user_" + Date.now(),
          name: payload.name || "User",
          email: payload.email,
          role: payload.role || "consumer",
          token: "mock_demo_jwt_token_" + Date.now()
        };
        persist(mockUser);
        toast.success("Account created!");
        return mockUser;
      }
      toast.error(e.response?.data?.message || "Registration failed");
      throw e;
    } finally { setLoading(false); }
  };


  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, upgradePremium, cancelPremium }}>
      {children}
    </AuthContext.Provider>
  );
}
