import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { getLocalFarmerOrders } from "../../services/api";
import { syncStatus, syncPayment, subscribeToSyncEvents, notifySyncListeners } from "../../services/cloudSync";
import { socket } from "../../services/socket";
import toast from "react-hot-toast";

const STATUSES = ["Processing", "Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

export default function OrdersReceived() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const statusFilter = searchParams.get("status") || "all";

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.get("/orders/farmer/received");
      let data = Array.isArray(res.data) ? res.data : [];
      const local = await getLocalFarmerOrders();
      const seen = new Set(data.map(o => o._id));
      local.forEach(l => {
        if (!seen.has(l._id)) {
          seen.add(l._id);
          data.push(l);
        }
      });
      data.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
      setOrders(data);
    } catch (err) {
      console.warn("Failed to fetch farmer orders from API, fallback to local storage:", err);
      const local = await getLocalFarmerOrders();
      setOrders(local.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())));
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
  }, [location.search]);

  const filteredOrders = orders.filter(o => {
    if (statusFilter === "all") return true;
    if (statusFilter === "delivered") return o.status === "Delivered";
    if (statusFilter === "cancelled") return o.status === "Cancelled";
    if (statusFilter === "current") return o.status !== "Delivered" && o.status !== "Cancelled";
    return true;
  });

  const resetDemoStatuses = () => {
    localStorage.removeItem("farmer_order_status_overrides");
    localStorage.removeItem("farmer_order_payment_overrides");
    notifySyncListeners();
    toast.success("Order statuses & payment overrides reset to defaults!");
    load(true);
  };

  const updatePayment = async (id, isPaid) => {
    // 1. Optimistically update local component state
    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, isPaid } : o))
    );

    // 2. Sync to cloud store across browsers
    await syncPayment(id, isPaid);

    // 3. Send API call if present
    try {
      await api.put(`/orders/pay/${id}`, { isPaid });
    } catch (err) {
      console.warn("API payment update failed, fallback to local persistence:", err);
    }

    if (isPaid) {
      toast.success(`Order #${id.slice(-6).toUpperCase()} marked as Paid ✅`);
    } else {
      toast.success(`Order #${id.slice(-6).toUpperCase()} marked as Payment Pending ⏳`);
    }
  };

  const updateStatus = async (id, newStatus, userId) => {
    // 1. Optimistically update local component state immediately
    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o))
    );

    // 2. Sync to cloud store across browsers
    await syncStatus(id, newStatus);

    // 3. Send API call to backend if present
    try {
      await api.put(`/orders/status/${id}`, { status: newStatus });
    } catch (err) {
      console.warn("API status update failed, fallback to local persistence:", err);
    }

    if (newStatus === "Delivered") {
      toast.success(`Order #${id.slice(-6).toUpperCase()} marked as Delivered (moved to Delivered Orders tab)`);
    } else if (newStatus === "Cancelled") {
      toast.error(`Order #${id.slice(-6).toUpperCase()} marked as Cancelled (moved to Cancelled Orders tab)`);
    } else {
      toast.success(`Order #${id.slice(-6).toUpperCase()} status updated to "${newStatus}"`);
    }

    if (socket) {
      try {
        socket.emit("order:status_update", { userId, orderId: id, status: newStatus });
      } catch (e) {}
    }
  };

  return (
    <div className="container dash" style={{ padding: '3rem 1.5rem', minHeight: '75vh' }}>
      <aside className="sidebar">
        <Link to="/farmer">Overview</Link>
        <Link to="/farmer/products">My Products</Link>
        <Link to="/farmer/orders?status=all" className={statusFilter === "all" ? "active" : ""}>
          All Orders ({orders.length})
        </Link>
        <Link to="/farmer/orders?status=delivered" className={statusFilter === "delivered" ? "active" : ""}>
          Delivered Orders ({orders.filter(o => o.status === "Delivered").length})
        </Link>
        <Link to="/farmer/orders?status=cancelled" className={statusFilter === "cancelled" ? "active" : ""}>
          Cancelled Orders ({orders.filter(o => o.status === "Cancelled").length})
        </Link>
        <Link to="/farmer/profile">Profile</Link>
      </aside>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>
              {statusFilter === "delivered" ? "Delivered Orders 🚚" : statusFilter === "cancelled" ? "Cancelled Orders ❌" : "All Received Orders 📦"}
            </h1>
            <p className="muted" style={{ fontSize: '0.95rem' }}>
              Farmer Account: <strong>farmer@demo.com</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-sm btn-outline" onClick={resetDemoStatuses} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              ↺ Reset Statuses
            </button>
            <button className="btn btn-sm" onClick={() => load(true)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              🔄 Refresh Orders
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>Loading received orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="card text-center" style={{ padding: '4rem 2rem', borderStyle: 'dashed' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📥</div>
            <h3>No {statusFilter === "delivered" ? "delivered" : statusFilter === "cancelled" ? "cancelled" : "received"} orders found</h3>
            <p className="muted" style={{ marginBottom: '1.5rem' }}>
              Orders placed by customers for your products will appear here automatically.
            </p>
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
                  <th style={{ padding: '1rem' }}>Payment Status</th>
                  <th style={{ padding: '1rem' }}>Delivery Status</th>
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
                      <span className={`badge ${o.isPaid ? 'badge-organic' : 'badge-discount'}`} style={{ fontSize: '0.82rem' }}>
                        {o.paymentMethod || "COD"} ({o.isPaid ? "Paid ✅" : "Pending ⏳"})
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span className={`badge ${o.status === "Delivered" ? "badge-organic" : o.status === "Cancelled" ? "badge-danger" : "badge-discount"}`} style={{ fontSize: '0.82rem' }}>
                          {o.status === "Delivered" ? "Delivered ✅" : o.status === "Out for Delivery" ? "Out for Delivery 🛵" : o.status === "Shipped" ? "Shipped 🚚" : o.status === "Cancelled" ? "Cancelled ❌" : `${o.status || "Confirmed"} 👍`}
                        </span>
                        {o.deliveryAgent && (
                          <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            🛵 Driver: {o.deliveryAgent.name}
                          </span>
                        )}
                      </div>
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
