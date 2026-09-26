import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { getLocalFarmerOrders } from "../../services/api";
import { socket } from "../../services/socket";
import toast from "react-hot-toast";

const STATUSES = ["Processing", "Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

export default function OrdersReceived() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const statusFilter = searchParams.get("status") || "current";

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/orders/farmer/received");
      let data = Array.isArray(res.data) ? res.data : [];
      const local = getLocalFarmerOrders();
      
      const seen = new Set(data.map(o => o._id));
      local.forEach(l => {
        if (!seen.has(l._id)) {
          seen.add(l._id);
          data.push(l);
        }
      });
      setOrders(data);
    } catch (err) {
      console.warn("Failed to fetch farmer orders from API, fallback to local storage:", err);
      setOrders(getLocalFarmerOrders());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [location.search]);

  const filteredOrders = orders.filter(o => 
    statusFilter === "delivered" ? o.status === "Delivered" : o.status !== "Delivered"
  );

  const updateStatus = async (id, newStatus, userId) => {
    try {
      await api.put(`/orders/status/${id}`, { status: newStatus });
    } catch (err) {
      console.warn("API status update failed, updating local storage:", err);
    }

    // Update in all_local_orders
    try {
      let allLocal = JSON.parse(localStorage.getItem("all_local_orders") || "[]");
      allLocal = allLocal.map(o => o._id === id ? { ...o, status: newStatus } : o);
      localStorage.setItem("all_local_orders", JSON.stringify(allLocal));
    } catch (e) {}

    // Update in customer specific local storage keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("local_orders_")) {
        try {
          let userOrders = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(userOrders)) {
            let updated = userOrders.map(o => o._id === id ? { ...o, status: newStatus } : o);
            localStorage.setItem(key, JSON.stringify(updated));
          }
        } catch (e) {}
      }
    });

    toast.success(`Order status updated to "${newStatus}"`);
    if (socket) {
      try {
        socket.emit("order:status_update", { userId, orderId: id, status: newStatus });
      } catch (e) {}
    }
    load();
  };

  return (
    <div className="container dash" style={{ padding: '3rem 1.5rem', minHeight: '75vh' }}>
      <aside className="sidebar">
        <Link to="/farmer">Overview</Link>
        <Link to="/farmer/products">My Products</Link>
        <Link to="/farmer/orders?status=current" className={statusFilter === "current" ? "active" : ""}>
          Current Orders ({orders.filter(o => o.status !== "Delivered").length})
        </Link>
        <Link to="/farmer/orders?status=delivered" className={statusFilter === "delivered" ? "active" : ""}>
          Delivered Orders ({orders.filter(o => o.status === "Delivered").length})
        </Link>
        <Link to="/farmer/profile">Profile</Link>
      </aside>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>
              {statusFilter === "delivered" ? "Delivered Orders 🚚" : "Current Orders Received 📦"}
            </h1>
            <p className="muted" style={{ fontSize: '0.95rem' }}>
              Farmer Account: <strong>farmer@demo.com</strong>
            </p>
          </div>
          <button className="btn btn-sm" onClick={load} style={{ padding: '0.5rem 1rem' }}>
            🔄 Refresh Orders
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>Loading received orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="card text-center" style={{ padding: '4rem 2rem', borderStyle: 'dashed' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📥</div>
            <h3>No {statusFilter === "delivered" ? "delivered" : "current"} orders found</h3>
            <p className="muted">Orders placed by customers for your products will appear here automatically.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Order ID</th>
                  <th style={{ padding: '1rem' }}>Customer</th>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Items Ordered</th>
                  <th style={{ padding: '1rem' }}>Total Amount</th>
                  <th style={{ padding: '1rem' }}>Payment</th>
                  <th style={{ padding: '1rem' }}>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <Link to={`/orders/${o._id}`} style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                        #{o._id.slice(-6).toUpperCase()}
                      </Link>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                        {o.user?.name || "Customer"}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {o.user?.email || o.shippingAddress?.address || "Hyderabad"}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {o.items?.map((i, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                            {i.image && (
                              <img src={i.image} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '4px', background: 'var(--bg-soft)' }} />
                            )}
                            <span><strong>{i.quantity}x</strong> {i.name}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                      ₹{Number(o.totalPrice || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${o.isPaid ? 'badge-organic' : 'badge-discount'}`} style={{ fontSize: '0.78rem' }}>
                        {o.paymentMethod || "COD"} ({o.isPaid ? "Paid ✅" : "Pending ⏳"})
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <select 
                        value={o.status || "Processing"} 
                        onChange={(e) => updateStatus(o._id, e.target.value, o.user?._id || o.user)}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontWeight: '600', fontSize: '0.85rem' }}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
