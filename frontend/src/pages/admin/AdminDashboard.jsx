import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/admin/analytics").then((r) => setData(r.data)); }, []);
  return (
    <div className="container dash">
      <aside className="sidebar">
        <Link to="/admin" className="active">Overview</Link>
        <Link to="/admin/users">Users</Link>
        <Link to="/admin/orders">Orders</Link>
      </aside>
      <div>
        <h1 className="mb-2">Admin Dashboard</h1>
        {data && (
          <>
            <div className="stat-grid mb-2">
              <div className="stat"><div className="label">Users</div><div className="value">{data.users}</div></div>
              <div className="stat"><div className="label">Farmers</div><div className="value">{data.farmers}</div></div>
              <div className="stat"><div className="label">Products</div><div className="value">{data.products}</div></div>
              <div className="stat"><div className="label">Orders</div><div className="value">{data.orders}</div></div>
              <div className="stat"><div className="label">Revenue</div><div className="value">₹{data.revenue}</div></div>
            </div>
            <h3 className="mb-2">Best selling</h3>
            <table>
              <thead><tr><th>Name</th><th>Price</th><th>Sold</th></tr></thead>
              <tbody>{data.topProducts.map((p) => <tr key={p._id}><td>{p.name}</td><td>₹{p.price}</td><td>{p.sold}</td></tr>)}</tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
