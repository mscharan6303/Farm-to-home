import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      toast.success("Account created successfully!");
      nav("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '85vh', background: '#fff' }}>
      <div style={{ 
        flex: 1, 
        display: 'none', 
        '@media (min-width: 900px)': { display: 'block' },
        background: 'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80) center/cover',
        position: 'relative'
      }} className="auth-bg">
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(255,255,255,1), transparent)' }}></div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 2rem', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', marginBottom: '2rem', textDecoration: 'none', fontWeight: '600' }}>
            <FiArrowLeft /> Back to Home
          </Link>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Create Account</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>Join thousands of users eating fresh, organic food.</p>
          
          <form onSubmit={handleSubmit} className="grid" style={{ gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Full Name</label>
              <input type="text" className="input" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Email Address</label>
              <input type="email" className="input" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Phone Number</label>
              <input type="text" className="input" placeholder="+91 9876543210" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Password</label>
              <input type="password" className="input" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Join As</label>
              <select className="select" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                <option value="user">Customer</option>
                <option value="farmer">Farmer / Seller</option>
                <option value="delivery">Delivery Agent / Driver 🛵</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-block" disabled={loading} style={{ padding: '1rem', marginTop: '1rem', fontSize: '1.1rem' }}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          
          <p className="alt" style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--muted)' }}>
            Already have an account? <Link to="/login" style={{ fontWeight: '600' }}>Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
