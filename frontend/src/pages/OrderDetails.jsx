import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiMapPin, FiCreditCard } from "react-icons/fi";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(r => setOrder(r.data))
      .catch((err) => {
        console.warn("Backend order details fetch failed, searching local orders:", err);
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith("local_orders_"));
        let found = null;
        for (const k of allKeys) {
          try {
            const list = JSON.parse(localStorage.getItem(k) || "[]");
            found = list.find(o => o._id === id);
            if (found) break;
          } catch(e) {}
        }
        if (found) setOrder(found);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!order) return <div className="container text-center mt-4"><h2>Order not found</h2></div>;

  return (
    <div className="container animate-slide-up" style={{ padding: '4rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link to="/orders" style={{ color: 'var(--muted)', fontWeight: '500', marginBottom: '1rem', display: 'inline-block' }}>&larr; Back to all orders</Link>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Order Details</h1>
          <p className="muted" style={{ fontSize: '1.1rem' }}>Order #{order._id}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Placed on</div>
          <strong style={{ fontSize: '1.1rem' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
        </div>
      </div>

      <div className="cart-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Status Tracker Stepper */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiTruck color="var(--primary)" /> Live Order Tracking
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginTop: '2rem' }}>
              {['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'].map((step, index, arr) => {
                const isActive = arr.indexOf(order.status) >= index;
                return (
                  <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                    <div style={{ 
                      width: '30px', height: '30px', borderRadius: '50%', 
                      background: isActive ? 'var(--primary)' : '#e5e7eb', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      color: '#fff', marginBottom: '10px'
                    }}>
                      {isActive && <FiCheckCircle size={16} />}
                    </div>
                    <span style={{ fontSize: '0.85rem', textAlign: 'center', color: isActive ? 'var(--text)' : 'var(--muted)', fontWeight: isActive ? '600' : '400' }}>{step}</span>
                  </div>
                );
              })}
              {/* Line behind stepper */}
              <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '3px', background: '#e5e7eb', zIndex: 0 }}>
                 <div style={{ 
                   height: '100%', background: 'var(--primary)', 
                   width: `${Math.max(0, ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'].indexOf(order.status)) / 4 * 100}%`,
                   transition: 'width 0.5s ease-in-out'
                 }}></div>
              </div>
            </div>

            {order.isSubscription && (
              <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f3ff', borderRadius: 'var(--radius-sm)', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>🔁</span>
                <div>
                  <strong style={{ display: 'block', color: '#5b21b6' }}>Subscription Active</strong>
                  <span style={{ color: '#6d28d9', fontSize: '0.9rem' }}>You will receive these items {order.frequency?.toLowerCase() || 'weekly'}.</span>
                </div>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Items in this Order</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {order.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: idx !== order.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <img 
                    src={item.image || 'https://placehold.co/100'} 
                    alt={item.name} 
                    style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--bg-soft)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }} 
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/f4f7f5/1b4332?text=${encodeURIComponent(item.name || 'Product')}`; }}
                  />
                  <div style={{ flex: 1 }}>
                    <Link to={`/products/${item.product}`} style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--text)' }}>{item.name || "Product Unavailable"}</Link>
                    <div className="muted" style={{ marginTop: '0.2rem' }}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '1.15rem' }}>₹{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Summary */}
          <div className="card summary" style={{ padding: '2rem', position: 'static' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Payment Summary</h3>
            <div className="summary-row"><span>Items Total</span> <span>₹{order.itemsPrice?.toFixed(2)}</span></div>
            <div className="summary-row"><span>Delivery Fee</span> <span>₹{order.deliveryCharge?.toFixed(2)}</span></div>
            <div className="summary-row total" style={{ fontSize: '1.5rem' }}><span>Grand Total</span> <span>₹{order.totalPrice?.toFixed(2)}</span></div>
            
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-soft)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiCreditCard color="var(--primary)" size={20} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>Payment Method</strong>
                <span className="muted" style={{ fontSize: '0.9rem' }}>{order.paymentMethod} • {order.isPaid ? "Paid" : "Pending"}</span>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiMapPin color="var(--primary)" /> Shipping Info
            </h3>
            <p style={{ lineHeight: '1.6', color: 'var(--text)' }}>
              <strong>{order.user?.name}</strong><br />
              {order.shippingAddress.address}<br />
              {order.shippingAddress.city}, {order.shippingAddress.country} - {order.shippingAddress.postalCode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
