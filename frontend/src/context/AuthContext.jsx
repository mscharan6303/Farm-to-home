import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const persist = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      persist(data);
      toast.success(`Welcome back, ${data.name}!`);
      return data;
    } catch (e) {
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
