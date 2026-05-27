import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function OrderMonitoring() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get("/orders").then((r) => setOrders(r.data)); }, []);
  return (
    <div className="container dash">
      <aside className="sidebar">
        <Link to="/admin">Overview</Link>
        <Link to="/admin/users">Users</Link>
        <Link to="/admin/orders" className="active">Orders</Link>
      </aside>
      <div>
        <h1 className="mb-2">All Orders</h1>
        <table>
          <thead><tr><th>#</th><th>User</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>{orders.map((o) => (
            <tr key={o._id}>
              <td>#{o._id.slice(-6)}</td>
              <td>{o.user?.name}</td>
              <td>₹{o.totalPrice}</td>
              <td><span className="badge">{o.status}</span></td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
            </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
