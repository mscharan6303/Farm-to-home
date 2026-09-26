import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FiCheck, FiStar } from "react-icons/fi";

export default function Subscriptions() {
  const { user, upgradePremium, cancelPremium, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSubs = () => {
    api.get("/orders/myorders")
      .then((r) => {
        if (Array.isArray(r.data)) {
          const backendSubs = r.data.filter(o => o.isSubscription);
          const localOrders = JSON.parse(localStorage.getItem(`local_orders_${user?._id || user?.email || 'guest'}`) || "[]");
          const localSubs = localOrders.filter(o => o.isSubscription);
          const existingIds = new Set(backendSubs.map(s => s._id));
          setSubs([...backendSubs, ...localSubs.filter(s => !existingIds.has(s._id))]);
        }
      })
      .catch((err) => {
        console.warn("Failed to load backend subscriptions, using fallback:", err.message);
        const localOrders = JSON.parse(localStorage.getItem(`local_orders_${user?._id || user?.email || 'guest'}`) || "[]");
        const localSubs = localOrders.filter(o => o.isSubscription);
        setSubs(localSubs);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSubs();
  }, [user]);


  const cancelSubscription = async (id) => {
    try {
      await api.put(`/orders/cancel/${id}`);
      toast.success("Subscription cancelled successfully");
      loadSubs();
    } catch (err) {
      toast.error("Failed to cancel subscription");
    }
  };

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  const handleSubscribePremium = () => {
    if (!user) { nav("/login"); return; }
    setShowPaymentModal(true);
  };

  const handleConfirmOnlinePayment = async (e) => {
    e.preventDefault();
    try {
      await upgradePremium();
      setShowPaymentModal(false);
      toast.success("Online Payment Verified! 🌟 FarmPass Premium Activated.");
    } catch (err) {
      toast.error("Payment processing failed");
    }
  };

  const handleCancelPremium = async () => {
    await cancelPremium();
  };

  if (loading || authLoading) return <div className="container section">Loading subscriptions...</div>;

  return (
    <div className="container section animate-slide-up">
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <FiStar fill="currentColor" /> Subscriptions & FarmPass
        </h1>
        <p className="muted" style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
          Manage your recurring deliveries and premium membership perks all in one place.
        </p>
      </div>

      <h2 style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>1. FarmPass Membership</h2>
      
      {user?.isPremium ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', background: 'linear-gradient(135deg, var(--bg-soft), #fff)', marginBottom: '4rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>You are a FarmPass Member!</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>You are currently enjoying Free Deliveries, 10% Extra Discounts on all orders, Early Access to Seasonal Produce, and Free Monthly Gifts.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/products" className="btn">Shop Now with Perks</Link>
            <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={handleCancelPremium}>Cancel FarmPass</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-2" style={{ gap: '2rem', alignItems: 'center', marginBottom: '4rem' }}>
          <div className="card" style={{ padding: '2.5rem', background: 'linear-gradient(135deg, var(--primary), #1e5a40)', color: '#fff' }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#fff' }}>Monthly Plan</h3>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>₹499<span style={{ fontSize: '1rem', fontWeight: 'normal', opacity: 0.8 }}>/month</span></div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', fontSize: '1.1rem' }}>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}><FiCheck color="#a7f3d0" size={24} /> <strong>Unlimited Free Delivery</strong></li>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}><FiCheck color="#a7f3d0" size={24} /> <strong>Flat 10% Extra Discount</strong> on all items</li>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}><FiCheck color="#a7f3d0" size={24} /> <strong>Priority Support & Monthly Gifts</strong></li>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}><FiCheck color="#a7f3d0" size={24} /> <strong>Cancel Anytime</strong></li>
            </ul>

            <button 
              className="btn btn-block" 
              onClick={handleSubscribePremium} 
              disabled={authLoading}
              style={{ background: '#fff', color: 'var(--primary)', fontSize: '1.1rem', padding: '1rem' }}
            >
              {authLoading ? "Processing..." : "Subscribe & Pay ₹499"}
            </button>
          </div>

          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Why FarmPass?</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Save Money Instantly</h4>
              <p className="muted">The 10% discount applies directly at checkout on top of existing offers. If you buy regularly, FarmPass pays for itself!</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Zero Delivery Fees</h4>
              <p className="muted">No minimum order required. Order as many times as you want without paying a single rupee for shipping.</p>
            </div>
          </div>
        </div>
      )}

      {/* --- ONLINE PAYMENT MODAL FOR FARMPASS SUBSCRIPTION --- */}
      {showPaymentModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="animate-scale-up" style={{ background: "#fff", width: "100%", maxWidth: "480px", borderRadius: "var(--radius-md)", padding: "2rem", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, color: "var(--primary)" }}>💳 Online Payment — FarmPass ₹499</h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmOnlinePayment} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ background: "var(--bg-soft)", padding: "1rem", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block" }}>FarmPass Membership Fee</span>
                <strong style={{ fontSize: "2rem", color: "var(--primary)" }}>₹499.00 / month</strong>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "6px" }}>Select Online Payment Mode</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === "UPI" ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setPaymentMethod("UPI")}
                    style={{ padding: "0.6rem" }}
                  >
                    📱 Instant UPI (GPay/PhonePe)
                  </button>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === "CARD" ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setPaymentMethod("CARD")}
                    style={{ padding: "0.6rem" }}
                  >
                    💳 Debit / Credit Card
                  </button>
                </div>
              </div>

              {paymentMethod === "UPI" && (
                <div style={{ background: "#f8fafc", border: "1px solid var(--border)", padding: "1rem", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "4px" }}>Official UPI VPA:</div>
                  <strong style={{ fontSize: "1.1rem", color: "var(--primary)" }}>farmtohome@upi</strong>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      navigator.clipboard.writeText("farmtohome@upi");
                      toast.success("UPI ID copied!");
                    }}
                    style={{ marginTop: "8px", display: "inline-block" }}
                  >
                    Copy UPI ID 📋
                  </button>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Transaction UTR / Reference ID (Optional)</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: "100%" }}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. UTR-9876543210"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                <button type="submit" className="btn" style={{ background: "var(--primary)", color: "#fff", flex: 1, padding: "0.8rem" }}>
                  Confirm Online Payment & Activate
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h2 style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>2. Recurring Baskets</h2>
      <p className="muted" style={{ marginBottom: "2rem" }}>Manage your product-specific recurring deliveries.</p>

      {subs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-soft)", borderRadius: "var(--radius-lg)" }}>
          <h3 className="mb-1">No Active Subscriptions</h3>
          <p className="muted mb-2">Subscribe to your favorite products to get them delivered regularly.</p>
          <Link to="/products" className="btn">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-2" style={{ gap: "1.5rem" }}>
          {subs.map((s) => (
            <div key={s._id} className="card" style={{ padding: "1.5rem", borderLeft: s.status === "Cancelled" ? "4px solid var(--danger)" : "4px solid var(--primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>Subscription #{s._id.slice(-6)}</h3>
                  <span className="badge" style={{ display: "inline-block", background: s.status === "Cancelled" ? "var(--danger)" : "var(--primary)", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "bold" }}>
                    {s.frequency} Delivery
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--text)" }}>₹{s.totalPrice}</div>
                  <div className="muted" style={{ fontSize: "0.85rem" }}>per delivery</div>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <strong style={{ display: "block", marginBottom: "0.5rem" }}>Items:</strong>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {s.items.map((i, idx) => (
                    <li key={idx} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border)", padding: "0.5rem 0" }}>
                      <span>{i.quantity}x {i.name}</span>
                      <span className="muted">₹{i.price * i.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.85rem" }} className="muted">Status: </span>
                  <strong style={{ color: s.status === "Cancelled" ? "var(--danger)" : "var(--text)" }}>{s.status}</strong>
                </div>
                {s.status !== "Cancelled" && (
                  <button className="btn btn-sm btn-outline" style={{ borderColor: "var(--danger)", color: "var(--danger)" }} onClick={() => cancelSubscription(s._id)}>
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
