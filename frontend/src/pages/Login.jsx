import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      nav("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '85vh', background: '#fff' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 2rem', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', marginBottom: '2rem', textDecoration: 'none', fontWeight: '600' }}>
            <FiArrowLeft /> Back to Home
          </Link>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Welcome Back</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>Enter your credentials to access your account.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="input" 
                placeholder="you@example.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={{ padding: '1rem' }}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                className="input" 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ padding: '1rem' }}
              />
            </div>
            
            <button type="submit" className="btn btn-block" disabled={loading} style={{ padding: '1rem', marginTop: '1rem', fontSize: '1.1rem' }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⚡ Quick Demo Login
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn btn-sm btn-outline" 
                onClick={() => { setEmail("user@demo.com"); setPassword("demo123"); }}
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              >
                👤 Customer
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-outline" 
                onClick={() => { setEmail("farmer@demo.com"); setPassword("demo123"); }}
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              >
                🌾 Farmer
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-outline" 
                onClick={() => { setEmail("delivery@demo.com"); setPassword("demo123"); }}
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              >
                🛵 Delivery Agent
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-outline" 
                onClick={() => { setEmail("admin@demo.com"); setPassword("demo123"); }}
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              >
                📊 Platform Admin
              </button>
            </div>
          </div>
          
          <p className="alt" style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--muted)' }}>
            Don't have an account? <Link to="/register" style={{ fontWeight: '600' }}>Sign up here</Link>
          </p>
        </div>
      </div>
      <div style={{ 
        flex: 1, 
        display: 'none', 
        '@media (min-width: 900px)': { display: 'block' },
        background: 'url(https://images.unsplash.com/photo-1595858619890-a5fc0c8b030e?w=1200&q=80) center/cover',
        position: 'relative'
      }} className="auth-bg">
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(255,255,255,1), transparent)' }}></div>
      </div>
    </div>
  );
}
