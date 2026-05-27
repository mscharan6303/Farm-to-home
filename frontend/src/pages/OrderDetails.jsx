import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";

const STEPS = ["Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  useEffect(() => { api.get(`/orders/${id}`).then((r) => setOrder(r.data)); }, [id]);
  if (!order) return <Loader />;
  const step = STEPS.indexOf(order.status);

  return (
    <div className="container section">
      <h1 className="mb-2">Order #{order._id.slice(-6)}</h1>
      <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="flex between" style={{ alignItems: "flex-end", marginBottom: "1.5rem" }}>
          <div>
            <div className="muted">Placed on</div>
            <strong>{new Date(order.createdAt).toLocaleString()}</strong>
          </div>
          <div className="text-right">
            <div className="muted">Total</div>
            <strong style={{ fontSize: "1.3rem", color: "var(--primary-dark)" }}>₹{order.totalPrice}</strong>
          </div>
        </div>

        {order.status !== "Cancelled" && (
          <div className="flex between" style={{ position: "relative", padding: "1rem 0" }}>
            <div style={{ position: "absolute", top: "50%", left: "5%", right: "5%", height: 3, background: "var(--border)" }} />
            <div style={{ position: "absolute", top: "50%", left: "5%", width: `${(step / (STEPS.length - 1)) * 90}%`, height: 3, background: "var(--primary)" }} />
            {STEPS.map((s, i) => (
              <div key={s} style={{ position: "relative", zIndex: 1, textAlign: "center", flex: 1 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto", background: i <= step ? "var(--primary)" : "var(--bg-soft)", color: "#fff", display: "grid", placeItems: "center", fontSize: ".8rem", fontWeight: 700 }}>{i + 1}</div>
                <div style={{ fontSize: ".75rem", marginTop: ".4rem", color: i <= step ? "var(--primary-dark)" : "var(--muted)" }}>{s}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem" }} className="cart-layout">
        <div className="card">
          {order.items.map((it) => (
            <div className="cart-row" key={it._id}>
              <img src={it.image || "https://via.placeholder.com/80"} />
              <div><strong>{it.name}</strong><div className="muted">Qty: {it.quantity}</div></div>
              <div></div>
              <strong>₹{(it.price * it.quantity).toFixed(0)}</strong>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 className="mb-2">Shipping</h3>
          <p>{order.shippingAddress.fullName}<br />{order.shippingAddress.phone}<br />{order.shippingAddress.address}<br />{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
          <hr style={{ margin: "1rem 0", border: 0, borderTop: "1px solid var(--border)" }} />
          <div><strong>Payment:</strong> {order.paymentMethod} {order.isPaid ? "✓ Paid" : ""}</div>
        </div>
      </div>
    </div>
  );
}
