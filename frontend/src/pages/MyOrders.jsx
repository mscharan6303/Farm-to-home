import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { getAllSyncedOrders, subscribeToSyncEvents } from "../services/cloudSync";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const synced = await getAllSyncedOrders();
      setOrders(synced.filter(o => o._id !== "ORD-1790402239214"));
    } catch (err) {
      console.warn("MyOrders sync error:", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const unsubscribe = subscribeToSyncEvents(() => {
      load(false);
    });
    const timer = setInterval(() => load(false), 8000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [user]);

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
