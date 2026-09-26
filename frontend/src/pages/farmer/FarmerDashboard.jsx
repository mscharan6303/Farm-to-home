import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getLocalFarmerOrders } from "../../services/api";
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

        let orderList = Array.isArray(o.data) ? [...o.data] : [];
        const local = getLocalFarmerOrders();
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
        const local = getLocalFarmerOrders();
        oCount = local.length;
        revenue = local.reduce((s, x) => s + (x.totalPrice || 0), 0);
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
        <Link to="/farmer/orders?status=all">All Orders ({stats.orders})</Link>
        <Link to="/farmer/orders?status=current">Current Active Orders</Link>
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
