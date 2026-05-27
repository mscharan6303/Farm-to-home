import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Checkout() {
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [addr, setAddr] = useState({ fullName: user?.name || "", phone: "", address: user?.address || "", city: "", state: "", pincode: "" });
  const [payment, setPayment] = useState("COD");
  const [placing, setPlacing] = useState(false);
  const delivery = subtotal > 500 ? 0 : 49;
  const total = subtotal + delivery;

  const placeOrder = async () => {
    if (Object.values(addr).some((v) => !v)) return toast.error("Please fill all address fields");
    if (!cart.items?.length) return toast.error("Cart is empty");
    setPlacing(true);
    try {
      const items = cart.items.map((i) => ({ product: i.product._id, quantity: i.quantity }));
      const payload = {
        items, shippingAddress: addr, paymentMethod: payment,
        itemsPrice: subtotal, deliveryCharge: delivery, discount: 0, totalPrice: total,
      };

      const { data: order } = await api.post("/orders", payload);
      clearCart();
      toast.success("Order placed!");
      nav(`/orders/${order._id}`);
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setPlacing(false); }
  };

  return (
    <div className="container section">
      <h1 className="mb-2">Checkout</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }} className="cart-layout">
        <div>
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
            <h3 className="mb-2">Shipping Address</h3>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {["fullName","phone","address","city","state","pincode"].map((k) => (
                <div className="form-group" key={k}>
                  <label>{k.replace(/([A-Z])/g, " $1")}</label>
                  <input className="input" value={addr[k]} onChange={(e) => setAddr({ ...addr, [k]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 className="mb-2">Payment Method</h3>
            {[
              { v: "COD", label: "Cash on Delivery" }
            ].map((opt) => (
              <label key={opt.v} className="flex center gap-1" style={{ padding: ".6rem 0", cursor: "pointer" }}>
                <input type="radio" name="pay" checked={payment === opt.v} onChange={() => setPayment(opt.v)} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <div className="summary">
          <h3>Order Summary</h3>
          <div className="summary-row"><span>Items ({cart.items?.length || 0})</span><span>₹{subtotal.toFixed(0)}</span></div>
          <div className="summary-row"><span>Delivery</span><span>{delivery === 0 ? "Free" : `₹${delivery}`}</span></div>
          <div className="summary-row total"><span>Total</span><span>₹{total.toFixed(0)}</span></div>
          <button className="btn btn-block mt-2" onClick={placeOrder} disabled={placing}>{placing ? "Placing..." : "Place order"}</button>
        </div>
      </div>
    </div>
  );
}
