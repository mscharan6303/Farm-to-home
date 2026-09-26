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

      let apiOrders = [];
      try {
        const r = await api.get("/orders/myorders");
        if (Array.isArray(r.data)) apiOrders = r.data;
      } catch (e) {}

      const orderMap = new Map();

      // 1. Add user local storage orders first
      const userKeys = [
        `local_orders_${user?._id}`,
        `local_orders_${user?.email}`,
        "all_local_orders",
        "local_orders_guest"
      ];

      userKeys.forEach((k) => {
        if (!k) return;
        try {
          const list = JSON.parse(localStorage.getItem(k) || "[]");
          if (Array.isArray(list)) {
            list.forEach((o) => {
              if (o && o._id) {
                orderMap.set(o._id, o);
              }
            });
          }
        } catch (e) {}
      });

      // 2. Add API orders
      apiOrders.forEach((o) => {
        if (o && o._id) {
          const existing = orderMap.get(o._id);
          orderMap.set(o._id, { ...existing, ...o });
        }
      });

      // 3. Add Synced orders (updating statuses)
      synced.forEach((o) => {
        if (o && o._id) {
          const existing = orderMap.get(o._id);
          orderMap.set(o._id, { ...existing, ...o, status: o.status || existing?.status });
        }
      });

      // 4. Force apply status overrides from cloud store and local overrides
      let localOverrides = {};
      try {
        localOverrides = JSON.parse(localStorage.getItem("farmer_order_status_overrides") || "{}");
      } catch (e) {}

      let cloudStoreOverrides = {};
      try {
        const storeStr = localStorage.getItem("cached_cloud_store");
        if (storeStr) {
          const parsed = JSON.parse(storeStr);
          cloudStoreOverrides = parsed.statusOverrides || {};
        }
      } catch (e) {}

      const allOverrides = { ...cloudStoreOverrides, ...localOverrides };

      const combined = Array.from(orderMap.values())
        .filter((o) => o._id !== "ORD-1790402239214")
        .map((o) => {
          if (allOverrides[o._id]) {
            return { ...o, status: allOverrides[o._id] };
          }
          return o;
        })
        .sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

      setOrders(combined);
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
    // Fast 2-second polling interval for real-time status updates across devices
    const timer = setInterval(() => load(false), 2000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [user]);

  const formatOrderDateTime = (dateStr) => {
    try {
      const d = new Date(dateStr || Date.now());
      if (isNaN(d.getTime())) return "Recently Placed";
      return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return "Recently Placed";
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "Pending").trim();
    if (s === "Delivered") return <span className="badge badge-organic" style={{ padding: '4px 10px', fontSize: '0.82rem' }}>Delivered ✅</span>;
    if (s === "Shipped") return <span className="badge badge-discount" style={{ background: '#3b82f6', color: '#fff', padding: '4px 10px', fontSize: '0.82rem' }}>Shipped 🚚</span>;
    if (s === "Out for Delivery") return <span className="badge badge-discount" style={{ background: '#8b5cf6', color: '#fff', padding: '4px 10px', fontSize: '0.82rem' }}>Out for Delivery 🛵</span>;
    if (s === "Confirmed") return <span className="badge badge-discount" style={{ background: '#10b981', color: '#fff', padding: '4px 10px', fontSize: '0.82rem' }}>Confirmed 👍</span>;
    if (s === "Processing") return <span className="badge badge-discount" style={{ background: '#0284c7', color: '#fff', padding: '4px 10px', fontSize: '0.82rem' }}>Processing ⏳</span>;
    if (s === "Cancelled") return <span className="badge badge-danger" style={{ background: '#ef4444', color: '#fff', padding: '4px 10px', fontSize: '0.82rem' }}>Cancelled ❌</span>;
    return <span className="badge badge-discount" style={{ padding: '4px 10px', fontSize: '0.82rem' }}>Pending ⏳</span>;
  };

  if (loading) return <Loader />;

  return (
    <div className="container animate-slide-up" style={{ padding: '4rem 1.5rem', minHeight: '70vh' }}>
      <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '2rem' }}>
        <small>Track your</small>My Orders ({orders.length})
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
                    <span className="muted" style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)', fontWeight: '500' }}>
                      📅 {formatOrderDateTime(o.createdAt)}
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
                    {getStatusBadge(o.status)}
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
