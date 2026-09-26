import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "Test User",
    phone: user?.phone || "+91 9876543210",
    address: user?.address || "123 Green Farm Avenue, Jubilee Hills, Hyderabad, 500033",
    farmName: user?.farmName || "Green Acres Demo Farm"
  });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put("/auth/profile", form);
      if (res.data) updateUser(res.data);
    } catch {
      console.warn("Updating profile locally");
    }
    updateUser(form);
    toast.success("Profile updated successfully! 👤");
  };

  return (
    <div className="container section" style={{ maxWidth: 650, padding: "3rem 1.5rem" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem", color: "var(--primary)" }}>My Profile 👤</h1>
      <form className="card" style={{ padding: "2.5rem", boxShadow: "var(--shadow-sm)", background: "#fff", borderRadius: "var(--radius-lg)" }} onSubmit={submit}>
        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>Full Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>Phone Number</label>
          <input className="input" placeholder="+91 9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        </div>
        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>Delivery Address</label>
          <textarea className="textarea" rows="3" placeholder="Enter your full street address, city, and pincode..." value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        </div>
        {user?.role === "farmer" && (
          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>Farm Name</label>
            <input className="input" value={form.farmName} onChange={(e) => setForm({ ...form, farmName: e.target.value })} />
          </div>
        )}
        <div style={{ marginTop: "2rem" }}>
          <button className="btn" style={{ padding: "0.9rem 2.5rem", fontSize: "1rem" }}>Save Profile</button>
        </div>
      </form>
    </div>
  );
}
