import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/myorders")
      .then(r => {
        if (Array.isArray(r.data)) {
          const localOrders = JSON.parse(localStorage.getItem(`local_orders_${user?._id || user?.email || 'guest'}`) || "[]");
          const existingIds = new Set(r.data.map(o => o._id));
          const combined = [...r.data, ...localOrders.filter(l => !existingIds.has(l._id))];
          setOrders(combined);
        }
      })
      .catch(err => {
        console.warn("Backend myorders failed, loading local orders:", err);
        const localOrders = JSON.parse(localStorage.getItem(`local_orders_${user?._id || user?.email || 'guest'}`) || "[]");
        setOrders(localOrders);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleDeleteOrder = async (e, orderId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      await api.delete(`/orders/${orderId}`).catch(() => {});
    } catch(err) {}

    const allKeys = Object.keys(localStorage).filter(k => k.startsWith("local_orders_"));
    for (const k of allKeys) {
      try {
        const list = JSON.parse(localStorage.getItem(k) || "[]");
        const updated = list.filter(o => o._id !== orderId);
        localStorage.setItem(k, JSON.stringify(updated));
      } catch(err) {}
    }

    setOrders(prev => prev.filter(o => o._id !== orderId));
    toast.success("Order deleted successfully!");
  };

  if (loading) return <Loader />;

  return (
    <div className="container animate-slide-up" style={{ padding: '4rem 1.5rem', minHeight: '70vh' }}>
      <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '2rem' }}>
        <small>Track your</small>My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="card text-center" style={{ padding: '4rem 2rem', borderStyle: 'dashed', borderColor: 'var(--border)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>No orders yet</h3>
          <p className="muted" style={{ marginBottom: '2rem' }}>You haven't placed any orders. Start exploring fresh produce today!</p>
          <Link to="/products" className="btn" style={{ padding: '0.8rem 2rem' }}>Shop Now</Link>
        </div>
      ) : (
        <div className="grid" style={{ gap: '1.5rem' }}>
          {orders.map(o => (
            <Link key={o._id} to={`/orders/${o._id}`} className="card" style={{ display: 'block', textDecoration: 'none', padding: '1.5rem 2rem', transition: '0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ background: 'var(--accent)', padding: '1rem', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    🛍️
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--text)', marginBottom: '0.2rem', fontFamily: 'var(--font-heading)' }}>
                      Order #{o._id.substring(o._id.length - 6).toUpperCase()}
                    </strong>
                    <span className="muted" style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
                      {o.items?.map(i => `${i.quantity}x ${i.name}`).join(', ').substring(0, 50)}
                      {o.items?.map(i => `${i.quantity}x ${i.name}`).join(', ').length > 50 && '...'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Amount</span>
                    <strong style={{ fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>₹{o.totalPrice?.toFixed(2) || '0.00'}</strong>
                  </div>

                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</span>
                    {o.status === "Delivered" ? (
                      <span className="badge badge-organic">Delivered</span>
                    ) : (
                      <span className="badge badge-discount">{o.status}</span>
                    )}
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={(e) => handleDeleteOrder(e, o._id)}
                    className="btn btn-sm btn-danger"
                    style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '4px 10px', fontSize: '0.8rem' }}
                  >
                    Delete
                  </button>
                  
                  <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    →
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
