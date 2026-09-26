import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getLocalFarmerOrders } from "../../services/api";
import { mockProducts } from "../../services/mockData";
import { subscribeToSyncEvents } from "../../services/cloudSync";

export default function FarmerDashboard() {
  const [stats, setStats] = useState({ products: mockProducts.length, orders: 0, revenue: 0 });
  const [isAvailable, setIsAvailable] = useState(() => {
    try {
      const stored = localStorage.getItem("farmer_availability_status");
      return stored !== null ? JSON.parse(stored) : true;
    } catch (e) { return true; }
  });

  const toggleAvailability = (val) => {
    setIsAvailable(val);
    try {
      localStorage.setItem("farmer_availability_status", JSON.stringify(val));
    } catch (e) {}
  };

  const loadStats = async () => {
    let pCount = mockProducts.length;
    let oCount = 0;
    let revenue = 0;

    try {
      const [p, o] = await Promise.all([
        api.get("/products/farmer/mine").catch(() => ({ data: [] })),
        api.get("/orders/farmer/received").catch(() => ({ data: [] }))
      ]);

      if (Array.isArray(p.data) && p.data.length > 0) {
        pCount = Math.max(p.data.length, mockProducts.length);
      }

      let orderList = Array.isArray(o.data) ? [...o.data] : [];
      const local = await getLocalFarmerOrders();
      const seen = new Set(orderList.map(x => x._id));
      local.forEach(l => {
        if (!seen.has(l._id)) {
          seen.add(l._id);
          orderList.push(l);
        }
      });

      oCount = orderList.length;
      revenue = orderList.reduce((s, x) => s + (x.totalPrice || 0), 0);
    } catch (e) {
      console.warn("Dashboard stats fetch fallback:", e);
      const local = await getLocalFarmerOrders();
      oCount = local.length;
      revenue = local.reduce((s, x) => s + (x.totalPrice || 0), 0);
    }

    setStats({ products: pCount, orders: oCount, revenue });
  };

  useEffect(() => {
    loadStats();
    const unsubscribe = subscribeToSyncEvents(() => {
      loadStats();
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="container dash" style={{ padding: '3rem 1.5rem' }}>
      <aside className="sidebar">
        <Link to="/farmer" className="active">Overview</Link>
        <Link to="/farmer/products">My Products ({stats.products})</Link>
        <Link to="/farmer/products/new">Add Product</Link>
        <Link to="/farmer/orders?status=all">All Orders Received ({stats.orders})</Link>
        <Link to="/farmer/orders?status=delivered">Delivered Orders</Link>
        <Link to="/farmer/orders?status=cancelled">Cancelled Orders</Link>
        <Link to="/farmer/profile">Profile</Link>
      </aside>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="mb-1" style={{ fontSize: '2rem' }}>Farmer Dashboard 🚜</h1>
            <p className="muted" style={{ margin: 0 }}>Account: <strong>farmer@demo.com</strong></p>
          </div>

          {/* Availability Toggle Box */}
          <div style={{ background: isAvailable ? '#ecfdf5' : '#fef2f2', border: isAvailable ? '1px solid #a7f3d0' : '1px solid #fca5a5', padding: '0.8rem 1.2rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: isAvailable ? '#065f46' : '#991b1b' }}>
                {isAvailable ? "🟢 Harvesting Active" : "🔴 Harvesting Paused"}
              </strong>
              <span style={{ fontSize: '0.78rem', color: isAvailable ? '#047857' : '#b91c1c' }}>
                {isAvailable ? "Accepting orders for today's delivery" : "Unavailable for new orders today"}
              </span>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isAvailable} 
                onChange={(e) => toggleAvailability(e.target.checked)} 
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', inset: 0, background: isAvailable ? 'var(--primary)' : '#ccc', borderRadius: '34px', transition: '0.4s'
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: '18px', width: '18px', left: isAvailable ? '26px' : '4px', bottom: '4px', background: '#fff', borderRadius: '50%', transition: '0.4s'
                }}></span>
              </span>
            </label>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat"><div className="label">Products listed</div><div className="value">{stats.products}</div></div>
          <div className="stat"><div className="label">Orders received</div><div className="value">{stats.orders}</div></div>
          <div className="stat"><div className="label">Total earnings</div><div className="value">₹{Number(stats.revenue).toFixed(2)}</div></div>
        </div>
      </div>
    </div>
  );
}
