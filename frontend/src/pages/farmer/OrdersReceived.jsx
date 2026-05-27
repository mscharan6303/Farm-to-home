import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

const STATUSES = ["Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

export default function OrdersReceived() {
  const [orders, setOrders] = useState([]);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const statusFilter = searchParams.get("status") || "current";

  const load = () => api.get("/orders/farmer/received").then((r) => setOrders(r.data));
  useEffect(() => { load(); }, []);

  const filteredOrders = orders.filter(o => 
    statusFilter === "delivered" ? o.status === "Delivered" : o.status !== "Delivered"
  );
  const updateStatus = async (id, status) => {
    await api.put(`/orders/status/${id}`, { status });
    toast.success("Status updated");
    load();
  };
  return (
    <div className="container dash">
      <aside className="sidebar">
        <Link to="/farmer">Overview</Link>
        <Link to="/farmer/products">My Products</Link>
        <Link to="/farmer/orders?status=current" className={statusFilter === "current" ? "active" : ""}>Current Orders</Link>
        <Link to="/farmer/orders?status=delivered" className={statusFilter === "delivered" ? "active" : ""}>Delivered Orders</Link>
      </aside>
      <div>
        <h1 className="mb-2">{statusFilter === "delivered" ? "Delivered Orders" : "Current Orders"}</h1>
        <table>
          <thead><tr><th>Order #</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {filteredOrders.map((o) => (
              <tr key={o._id}>
                <td>#{o._id.slice(-6)}</td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>{o.items.map((i) => i.name).join(", ")}</td>
                <td>₹{o.totalPrice}</td>
                <td>
                  <select value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
