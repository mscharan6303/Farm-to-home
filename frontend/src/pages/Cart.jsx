import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FiTrash2 } from "react-icons/fi";

export default function Cart() {
  const { cart, updateQty, removeFromCart, subtotal } = useCart();
  const nav = useNavigate();
  const delivery = subtotal > 500 ? 0 : 49;
  const total = subtotal + delivery;

  if (!cart.items?.length) {
    return (
      <div className="container section text-center">
        <h2>Your cart is empty 🛒</h2>
        <p className="muted mt-1">Add some fresh produce to get started.</p>
        <Link to="/products" className="btn mt-2">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="mb-2">Your Cart</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem" }} className="cart-layout">
        <div className="card">
          {cart.items.map((i) => {
            const p = i.product; if (!p) return null;
            const price = p.discountPrice > 0 ? p.discountPrice : p.price;
            return (
              <div className="cart-row" key={p._id}>
                <img src={p.images?.[0]?.url || "https://via.placeholder.com/80"} alt={p.name} />
                <div>
                  <Link to={`/products/${p._id}`}><strong>{p.name}</strong></Link>
                  <div className="muted" style={{ fontSize: ".85rem" }}>₹{price}/{p.unit}</div>
                </div>
                <div className="qty">
                  <button onClick={() => updateQty(p._id, i.quantity - 1)}>-</button>
                  <span>{i.quantity}</span>
                  <button onClick={() => updateQty(p._id, i.quantity + 1)}>+</button>
                </div>
                <div className="flex center gap-2">
                  <strong>₹{(price * i.quantity).toFixed(0)}</strong>
                  <button className="icon-btn" onClick={() => removeFromCart(p._id)}><FiTrash2 /></button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="summary">
          <h3 style={{ marginBottom: ".75rem" }}>Order Summary</h3>
          <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
          <div className="summary-row"><span>Delivery</span><span>{delivery === 0 ? "Free" : `₹${delivery}`}</span></div>
          <div className="summary-row total"><span>Total</span><span>₹{total.toFixed(0)}</span></div>
          <button className="btn btn-block mt-2" onClick={() => nav("/checkout")}>Proceed to checkout</button>
        </div>
      </div>
      <style>{`@media (max-width: 800px) { .cart-layout { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
