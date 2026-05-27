import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";

const STATUS_COLORS = {
  Pending: "#d4842a", Confirmed: "#3a5333", Shipped: "#1e6b8a",
  "Out for Delivery": "#7d9b76", Delivered: "#2d5a2d", Cancelled: "#b54a3a",
};

export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  useEffect(() => { api.get("/orders/myorders").then((r) => setOrders(r.data)); }, []);
  if (!orders) return <Loader />;
  if (!orders.length) return <div className="container section text-center"><h2>No orders yet</h2><Link to="/products" className="btn mt-2">Start shopping</Link></div>;
  return (
    <div className="container section">
      <h1 className="mb-2">My Orders</h1>
      <table>
        <thead><tr><th>Order #</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>#{o._id.slice(-6)}</td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td>{o.items.length}</td>
              <td>₹{o.totalPrice}</td>
              <td><span className="badge" style={{ background: STATUS_COLORS[o.status], color: "#fff" }}>{o.status}</span></td>
              <td><Link to={`/orders/${o._id}`} className="btn btn-sm btn-outline">View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
