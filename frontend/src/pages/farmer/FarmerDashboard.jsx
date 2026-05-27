import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function FarmerDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  useEffect(() => {
    (async () => {
      const [p, o] = await Promise.all([api.get("/products/farmer/mine"), api.get("/orders/farmer/received")]);
      const revenue = o.data.filter((x) => x.isPaid).reduce((s, x) => s + x.totalPrice, 0);
      setStats({ products: p.data.length, orders: o.data.length, revenue });
    })();
  }, []);
  return (
    <div className="container dash">
      <aside className="sidebar">
        <Link to="/farmer" className="active">Overview</Link>
        <Link to="/farmer/products">My Products</Link>
        <Link to="/farmer/products/new">Add Product</Link>
        <Link to="/farmer/orders?status=current">Current Orders</Link>
        <Link to="/farmer/orders?status=delivered">Delivered Orders</Link>
        <Link to="/chat">Messages</Link>
      </aside>
      <div>
        <h1 className="mb-2">Farmer Dashboard 🚜</h1>
        <div className="stat-grid">
          <div className="stat"><div className="label">Products listed</div><div className="value">{stats.products}</div></div>
          <div className="stat"><div className="label">Orders received</div><div className="value">{stats.orders}</div></div>
          <div className="stat"><div className="label">Total earnings</div><div className="value">₹{stats.revenue}</div></div>
        </div>
      </div>
    </div>
  );
}
