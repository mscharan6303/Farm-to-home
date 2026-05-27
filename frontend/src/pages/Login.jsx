import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const submit = async (e) => {
    e.preventDefault();
    try { 
      const res = await login(form.email, form.password); 
      if (res.role === "farmer") {
        nav("/farmer");
      } else {
        nav("/"); 
      }
    } catch {}
  };
  return (
    <div className="auth-wrap">
      <form onSubmit={submit} className="auth-card">
        <h2>Welcome back 👋</h2>
        <p className="sub">Login to your Farm to Home account (Consumers & Farmers)</p>
        <div className="form-group"><label>Email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="form-group"><label>Password</label><input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <button className="btn btn-block" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
        
        <p className="alt">No account? <Link to="/register">Sign up</Link></p>
      </form>
    </div>
  );
}
