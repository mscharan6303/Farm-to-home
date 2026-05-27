import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", address: "", role: "consumer", farmName: "",
  });
  const set = (k, v) => setForm({ ...form, [k]: v });
  const submit = async (e) => {
    e.preventDefault();
    try { await register(form); nav("/"); } catch {}
  };
  return (
    <div className="auth-wrap">
      <form onSubmit={submit} className="auth-card">
        <h2>Join Farm to Home 🌱</h2>
        <p className="sub">Create your account in seconds</p>
        <div className="form-group"><label>Full name</label><input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="form-group"><label>Email</label><input className="input" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div className="form-group"><label>Phone</label><input className="input" required value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div className="form-group"><label>Password (min 6 chars)</label><input className="input" type="password" minLength={6} required value={form.password} onChange={(e) => set("password", e.target.value)} /></div>
        <div className="form-group"><label>Address</label><textarea className="textarea" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
        <div className="form-group"><label>I am a</label>
          <select className="select" value={form.role} onChange={(e) => set("role", e.target.value)}>
            <option value="consumer">Consumer (I want to buy)</option>
            <option value="farmer">Farmer (I want to sell)</option>
          </select>
        </div>
        {form.role === "farmer" && (
          <div className="form-group"><label>Farm name</label><input className="input" value={form.farmName} onChange={(e) => set("farmName", e.target.value)} /></div>
        )}
        <button className="btn btn-block" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
        <p className="alt">Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}
