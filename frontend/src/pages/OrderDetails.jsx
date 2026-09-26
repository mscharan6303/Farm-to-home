import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { getAllSyncedOrders, subscribeToSyncEvents } from "../services/cloudSync";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiMapPin, FiCreditCard, FiXCircle } from "react-icons/fi";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const allOrders = await getAllSyncedOrders();
      let found = allOrders.find((o) => o._id === id);
      
      if (!found) {
        try {
          const r = await api.get(`/orders/${id}`);
          found = r.data;
        } catch (e) {}
      }

      if (found) {
        let statusOverrides = {};
        let paymentOverrides = {};
        try {
          statusOverrides = JSON.parse(localStorage.getItem("farmer_order_status_overrides") || "{}");
          paymentOverrides = JSON.parse(localStorage.getItem("farmer_order_payment_overrides") || "{}");
        } catch (e) {}

        let updated = { ...found };
        if (statusOverrides[found._id]) {
          updated.status = statusOverrides[found._id];
        }
        if (paymentOverrides[found._id] !== undefined) {
          updated.isPaid = paymentOverrides[found._id];
        }
        setOrder(updated);
      }
    } catch (err) {
      console.warn("OrderDetails fetch error:", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const unsubscribe = subscribeToSyncEvents(() => {
      load(false);
    });
    // Fast 2-second polling for real-time live stepper updates
    const timer = setInterval(() => load(false), 2000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [id]);

  const getItemImage = (item) => {
    if (typeof item.image === 'string' && item.image.length > 3 && !item.image.includes('placehold.co')) return item.image;
    if (item.images && item.images[0]?.url) return item.images[0].url;
    if (item.product?.images && item.product.images[0]?.url) return item.product.images[0].url;
    if (item.product?.image) return item.product.image;
    
    const lname = (item.name || '').toLowerCase();
    if (lname.includes('onion') || lname.includes('pyaaz')) return '/images/red_onion.png';
    if (lname.includes('aloo') || lname.includes('potato')) return '/images/aloo.png';
    if (lname.includes('tamatar') || lname.includes('tomato')) return '/images/tomato.png';
    if (lname.includes('gobi') || lname.includes('cauliflower')) return '/images/cauliflower.png';
    if (lname.includes('bhindi') || lname.includes('okra')) return '/images/okra.png';
    if (lname.includes('baingan') || lname.includes('eggplant')) return '/images/eggplant.png';
    if (lname.includes('gajar') || lname.includes('carrot')) return '/images/carrot.png';
    if (lname.includes('capsicum') || lname.includes('mirch')) return '/images/capsicum.png';
    if (lname.includes('spinach') || lname.includes('palak')) return '/images/spinach.png';
    if (lname.includes('mango') || lname.includes('aam')) return '/images/mango.png';
    if (lname.includes('ghee')) return '/images/ghee.png';
    if (lname.includes('pomegranate') || lname.includes('anaar')) return '/images/pomegranate.png';
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Product')}&background=1b4332&color=ffffff&size=128`;
  };

  if (loading) return <Loader />;
  if (!order || order._id === "ORD-1790402239214") return <div className="container text-center mt-4"><h2>Order not found</h2></div>;

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiTruck color="var(--primary)" /> Live Order Tracking
              </h3>
              <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.85rem', padding: '4px 12px', fontWeight: 'bold' }}>
                {order.deliverySlot || "🌅 Morning Slot (7:00 AM - 10:00 AM)"}
              </span>
            </div>

            {order.status === "Cancelled" ? (
              <div style={{ padding: '1.2rem 1.5rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', color: '#991b1b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '1rem' }}>
                <FiXCircle size={28} color="#dc2626" />
                <div>
                  <strong style={{ display: 'block', fontSize: '1.1rem' }}>Order Cancelled ❌</strong>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>This order was cancelled by the farmer/seller.</span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginTop: '2rem' }}>
                {['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'].map((step, index, arr) => {
                  const statusMap = { 'Processing': 'Pending', 'Pending': 'Pending', 'Confirmed': 'Confirmed', 'Shipped': 'Shipped', 'Out for Delivery': 'Out for Delivery', 'Delivered': 'Delivered' };
                  const currentStep = statusMap[order.status] || 'Pending';
                  const isActive = arr.indexOf(currentStep) >= index;
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
            )}

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
                    src={getItemImage(item)} 
                    alt={item.name} 
                    style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--bg-soft)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }} 
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Product')}&background=1b4332&color=ffffff&size=128`; }}
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
            <div className="summary-row"><span>Delivery Fee</span> <span>{order.deliveryCharge === 0 ? "Free" : `₹${order.deliveryCharge?.toFixed(2)}`}</span></div>
            <div className="summary-row total" style={{ fontSize: '1.5rem' }}><span>Grand Total</span> <span>₹{order.totalPrice?.toFixed(2)}</span></div>
            
            <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: order.status === "Cancelled" ? '#fef2f2' : order.isPaid ? '#ecfdf5' : 'var(--bg-soft)', border: order.status === "Cancelled" ? '1px solid #fca5a5' : order.isPaid ? '1px solid #a7f3d0' : '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                <FiCreditCard color={order.status === "Cancelled" ? '#dc2626' : order.isPaid ? '#059669' : 'var(--primary)'} size={22} />
                <div>
                  <strong style={{ display: 'block', fontSize: '1rem', color: order.status === "Cancelled" ? '#991b1b' : order.isPaid ? '#065f46' : 'var(--text)' }}>
                    {order.paymentMethod || "Online Payment"}
                  </strong>
                  <span className="badge" style={{ display: 'inline-block', background: order.status === "Cancelled" ? '#dc2626' : order.isPaid ? '#059669' : '#d97706', color: '#fff', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', marginTop: '4px' }}>
                    {order.status === "Cancelled" ? "❌ Order Cancelled" : order.isPaid ? "✅ Payment Completed" : "⏳ Cash Payment Pending"}
                  </span>
                </div>
              </div>
              {order.paymentResult?.id && (
                <div className="muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem', borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '0.5rem' }}>
                  Transaction Ref: <strong>{order.paymentResult.id}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Info */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiMapPin color="var(--primary)" /> Shipping Info
            </h3>
            <p style={{ lineHeight: '1.6', color: 'var(--text)' }}>
              <strong>{order.user?.name}</strong><br />
              {order.shippingAddress?.address}<br />
              {order.shippingAddress?.city}, {order.shippingAddress?.country} - {order.shippingAddress?.postalCode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
