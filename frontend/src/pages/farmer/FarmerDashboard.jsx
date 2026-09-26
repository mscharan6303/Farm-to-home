import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { mockProducts } from "../../services/mockData";

export default function FarmerDashboard() {
  const [stats, setStats] = useState({ products: mockProducts.length, orders: 0, revenue: 0 });

  useEffect(() => {
    (async () => {
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
        if (Array.isArray(o.data)) {
          oCount = o.data.length;
          revenue = o.data.filter((x) => x.isPaid).reduce((s, x) => s + x.totalPrice, 0);
        }
      } catch (e) {
        console.warn("Dashboard stats fetch fallback:", e);
      }

      setStats({ products: pCount, orders: oCount, revenue });
    })();
  }, []);

  return (
    <div className="container dash" style={{ padding: '3rem 1.5rem' }}>
      <aside className="sidebar">
        <Link to="/farmer" className="active">Overview</Link>
        <Link to="/farmer/products">My Products ({stats.products})</Link>
        <Link to="/farmer/products/new">Add Product</Link>
        <Link to="/farmer/orders?status=current">Current Orders</Link>
        <Link to="/farmer/orders?status=delivered">Delivered Orders</Link>
        <Link to="/farmer/profile">Profile</Link>
      </aside>
      <div style={{ flex: 1 }}>
        <h1 className="mb-2">Farmer Dashboard 🚜 (farmer@demo.com)</h1>
        <div className="stat-grid">
          <div className="stat"><div className="label">Products listed</div><div className="value">{stats.products}</div></div>
          <div className="stat"><div className="label">Orders received</div><div className="value">{stats.orders}</div></div>
          <div className="stat"><div className="label">Total earnings</div><div className="value">₹{Number(stats.revenue).toFixed(2)}</div></div>
        </div>
      </div>
    </div>
  );
}
