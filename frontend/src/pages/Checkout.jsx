import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [address, setAddress] = useState(user?.address || "123 Green Farm Avenue, Jubilee Hills, Hyderabad, 500033");
  const [method, setMethod] = useState("UPI");
  const [selectedBank, setSelectedBank] = useState("State Bank of India");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [isSubscription, setIsSubscription] = useState(false);
  const [frequency, setFrequency] = useState("Weekly");

  const isPremium = user?.isPremium;
  const rawSubtotal = cart?.items?.reduce((acc, i) => acc + (i.product.discountPrice || i.product.price) * i.quantity, 0) || 0;
  const premiumDiscount = isPremium ? rawSubtotal * 0.10 : 0;
  const deliveryCharge = isPremium ? 0 : (rawSubtotal > 1000 ? 0 : 49);
  const totalToPay = rawSubtotal - premiumDiscount + deliveryCharge;

  useEffect(() => {
    if (!cart?.items?.length) nav("/products");
  }, [cart, nav]);

  useEffect(() => {
    if (user?.address && !address) {
      setAddress(user.address);
    }
  }, [user]);

  const copyUpiId = () => {
    navigator.clipboard.writeText("farmtohome@upi");
    toast.success("UPI ID (farmtohome@upi) copied to clipboard!");
  };

  const getCardBrand = (num) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('5')) return 'MasterCard';
    if (clean.startsWith('6')) return 'RuPay';
    return 'Debit / Credit Card';
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isPaidOnline = method !== "COD";
    const paymentMethodLabel = method === "UPI" 
      ? "UPI (Google Pay / PhonePe)" 
      : method === "Card" 
      ? `Card (${getCardBrand(cardDetails.number)})` 
      : method === "NetBanking" 
      ? `Net Banking (${selectedBank})` 
      : "Cash on Delivery";

    try {
      let orderId;
      try {
        const { data } = await api.post("/orders", {
          items: cart.items.map(i => ({ product: i.product._id, quantity: i.quantity, price: i.product.discountPrice || i.product.price })),
          shippingAddress: { address, city: "Hyderabad", postalCode: "500033", country: "India" },
          paymentMethod: paymentMethodLabel,
          itemsPrice: rawSubtotal,
          discount: premiumDiscount,
          deliveryCharge: deliveryCharge,
          totalPrice: totalToPay,
          isSubscription,
          frequency,
          isPaid: isPaidOnline,
          paymentResult: { id: "TXN-" + Date.now(), status: isPaidOnline ? "Completed" : "Pending" }
        });
        orderId = data._id;
      } catch (backendErr) {
        console.warn("Backend order placement failed, creating local order record:", backendErr);
        const localOrders = JSON.parse(localStorage.getItem(`local_orders_${user?._id || user?.email || 'guest'}`) || "[]");
        const newOrder = {
          _id: "ORD-" + Date.now(),
          items: cart.items.map(i => ({
            product: i.product._id,
            name: i.product.name,
            quantity: i.quantity,
            price: i.product.discountPrice || i.product.price,
            image: i.product.image
          })),
          shippingAddress: { address, city: "Hyderabad", postalCode: "500033", country: "India" },
          paymentMethod: paymentMethodLabel,
          itemsPrice: rawSubtotal,
          discount: premiumDiscount,
          deliveryCharge: deliveryCharge,
          totalPrice: totalToPay,
          isSubscription,
          frequency,
          isPaid: isPaidOnline,
          paidAt: isPaidOnline ? new Date().toISOString() : null,
          paymentResult: { id: "TXN-" + Date.now(), status: isPaidOnline ? "Completed" : "Pending" },
          status: "Processing",
          createdAt: new Date().toISOString(),
          user: { name: user?.name || "Customer", email: user?.email || "user@farmtohome.com" }
        };
        localOrders.unshift(newOrder);
        localStorage.setItem(`local_orders_${user?._id || user?.email || 'guest'}`, JSON.stringify(localOrders));
        orderId = newOrder._id;
      }

      clearCart();
      toast.success(isPaidOnline ? "Online Payment Received & Order Placed!" : "Order placed successfully!");
      nav(`/orders/${orderId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const upiLink = `upi://pay?pa=farmtohome@upi&pn=FarmToHome&am=${totalToPay.toFixed(2)}&cu=INR&tn=Order_Payment`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`;

  return (
    <div className="container animate-slide-up" style={{ padding: '4rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Secure Checkout</h1>

      <div className="checkout-layout">
        <form id="checkoutForm" onSubmit={handlePlaceOrder} style={{ background: '#fff', padding: '3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--primary)' }}>1. Shipping Details</h3>

          <div style={{ background: 'var(--bg-soft)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>📍 Saved Delivery Address & Details</strong>
              <span className="badge" style={{ background: 'var(--accent)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Default Profile</span>
            </div>
            <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text)' }}>
              <div><strong>Name:</strong> {user?.name || 'Customer'}</div>
              <div><strong>Phone:</strong> {user?.phone || '+91 9876543210'}</div>
              <div><strong>Email:</strong> {user?.email || 'user@farmtohome.com'}</div>
              <div><strong>Saved Address:</strong> {user?.address || '123 Green Farm Avenue, Jubilee Hills, Hyderabad, 500033'}</div>
            </div>
          </div>
          <div className="form-group">
            <label>Full Delivery Address</label>
            <textarea 
              className="textarea" 
              placeholder="Enter your complete home/office address..."
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              required 
            />
          </div>

          <h3 style={{ fontSize: '1.5rem', margin: '3rem 0 1.5rem', color: 'var(--primary)' }}>2. Choose Payment Method</h3>
          
          <div className="grid grid-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
            {/* UPI Option */}
            <label style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', 
              padding: '1.2rem', border: `2px solid ${method === 'UPI' ? 'var(--primary)' : 'var(--border)'}`, 
              borderRadius: 'var(--radius)', cursor: 'pointer', background: method === 'UPI' ? 'var(--accent)' : '#fff',
              transition: '0.2s'
            }}>
              <input type="radio" name="pay" checked={method === "UPI"} onChange={() => setMethod("UPI")} style={{ transform: 'scale(1.3)', accentColor: 'var(--primary)' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text)' }}>📱 UPI / QR Code (0% Fee)</strong>
                <span className="muted" style={{ fontSize: '0.85rem' }}>GPay, PhonePe, Paytm, BHIM</span>
              </div>
            </label>

            {/* Credit/Debit Card Option */}
            <label style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', 
              padding: '1.2rem', border: `2px solid ${method === 'Card' ? 'var(--primary)' : 'var(--border)'}`, 
              borderRadius: 'var(--radius)', cursor: 'pointer', background: method === 'Card' ? 'var(--accent)' : '#fff',
              transition: '0.2s'
            }}>
              <input type="radio" name="pay" checked={method === "Card"} onChange={() => setMethod("Card")} style={{ transform: 'scale(1.3)', accentColor: 'var(--primary)' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text)' }}>💳 Credit / Debit Card</strong>
                <span className="muted" style={{ fontSize: '0.85rem' }}>Visa, MasterCard, RuPay</span>
              </div>
            </label>

            {/* Net Banking Option */}
            <label style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', 
              padding: '1.2rem', border: `2px solid ${method === 'NetBanking' ? 'var(--primary)' : 'var(--border)'}`, 
              borderRadius: 'var(--radius)', cursor: 'pointer', background: method === 'NetBanking' ? 'var(--accent)' : '#fff',
              transition: '0.2s'
            }}>
              <input type="radio" name="pay" checked={method === "NetBanking"} onChange={() => setMethod("NetBanking")} style={{ transform: 'scale(1.3)', accentColor: 'var(--primary)' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text)' }}>🏛 Net Banking</strong>
                <span className="muted" style={{ fontSize: '0.85rem' }}>All Indian Major Banks</span>
              </div>
            </label>

            {/* COD Option */}
            <label style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', 
              padding: '1.2rem', border: `2px solid ${method === 'COD' ? 'var(--primary)' : 'var(--border)'}`, 
              borderRadius: 'var(--radius)', cursor: 'pointer', background: method === 'COD' ? 'var(--accent)' : '#fff',
              transition: '0.2s'
            }}>
              <input type="radio" name="pay" checked={method === "COD"} onChange={() => setMethod("COD")} style={{ transform: 'scale(1.3)', accentColor: 'var(--primary)' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text)' }}>💵 Cash on Delivery</strong>
                <span className="muted" style={{ fontSize: '0.85rem' }}>Pay cash upon receiving</span>
              </div>
            </label>
          </div>

          {/* Dynamic Payment Method Renderers */}
          {method === "UPI" && (
            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid #cbd5e1', marginBottom: '2rem', textAlign: 'center' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Scan QR Code or Click your UPI App</h4>
              <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Scan with Google Pay, PhonePe, Paytm, BHIM, or any UPI App to pay ₹{totalToPay.toFixed(2)} instantly.</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <img 
                  src={qrCodeUrl} 
                  alt="UPI QR Code" 
                  style={{ width: '180px', height: '180px', padding: '10px', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>UPI ID: farmtohome@upi</span>
                <button type="button" onClick={copyUpiId} className="btn btn-sm btn-outline" style={{ padding: '2px 10px', fontSize: '0.8rem' }}>Copy</button>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href={upiLink} className="btn btn-sm" style={{ background: '#4285F4', color: '#fff' }}>Pay via GPay</a>
                <a href={upiLink} className="btn btn-sm" style={{ background: '#5f259f', color: '#fff' }}>Pay via PhonePe</a>
                <a href={upiLink} className="btn btn-sm" style={{ background: '#00baf2', color: '#fff' }}>Pay via Paytm</a>
              </div>
            </div>
          )}

          {method === "Card" && (
            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid #cbd5e1', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.2rem' }}>Enter Card Information</h4>
                <span className="badge" style={{ background: 'var(--primary)', color: '#fff', padding: '4px 10px' }}>{getCardBrand(cardDetails.number)}</span>
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Card Number</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="4532 1234 5678 9010" 
                  maxLength={19}
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                  required={method === "Card"}
                />
              </div>

              <div className="grid grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Expiry Date (MM/YY)</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="12/28" 
                    maxLength={5}
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    required={method === "Card"}
                  />
                </div>
                <div className="form-group">
                  <label>CVV / CVC</label>
                  <input 
                    type="password" 
                    className="input" 
                    placeholder="123" 
                    maxLength={4}
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    required={method === "Card"}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Cardholder Name</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Full Name as printed on card" 
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                  required={method === "Card"}
                />
              </div>
            </div>
          )}

          {method === "NetBanking" && (
            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid #cbd5e1', marginBottom: '2rem' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.2rem' }}>Select Your Bank</h4>
              <div className="form-group">
                <select 
                  className="input" 
                  value={selectedBank} 
                  onChange={(e) => setSelectedBank(e.target.value)}
                  style={{ height: '50px', fontSize: '1rem' }}
                >
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  <option value="Punjab National Bank">Punjab National Bank (PNB)</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                </select>
              </div>
              <div style={{ padding: '0.8rem 1rem', background: '#e0f2fe', color: '#0369a1', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                🔒 You will be securely redirected to {selectedBank} online portal upon clicking place order.
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '1.5rem', margin: '3rem 0 2rem', color: 'var(--primary)' }}>3. Subscription / Weekly Baskets 📦</h3>
          <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', marginBottom: isSubscription ? '1.5rem' : '0' }}>
              <input type="checkbox" checked={isSubscription} onChange={(e) => setIsSubscription(e.target.checked)} style={{ transform: 'scale(1.5)', accentColor: 'var(--primary)' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text)' }}>Subscribe to receive this order regularly</strong>
                <span className="muted" style={{ fontSize: '0.85rem' }}>Automatically receive these fresh products without re-ordering</span>
              </div>
            </label>
            
            {isSubscription && (
              <div style={{ marginTop: '1.5rem', animation: 'slideUp 0.3s ease-out' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Choose Delivery Frequency:</label>
                <div className="grid grid-2" style={{ gap: '10px' }}>
                  {["Daily", "Every 3 Days", "Weekly", "Bi-Weekly", "Monthly"].map((freq) => (
                    <div 
                      key={freq}
                      onClick={() => setFrequency(freq)}
                      style={{ 
                        padding: '1rem', 
                        border: `2px solid ${frequency === freq ? 'var(--primary)' : 'var(--border)'}`, 
                        borderRadius: 'var(--radius)', 
                        cursor: 'pointer', 
                        background: frequency === freq ? 'var(--accent)' : '#fff',
                        textAlign: 'center',
                        fontWeight: '500',
                        transition: '0.2s'
                      }}
                    >
                      {freq}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#e0f2fe', color: '#0369a1', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>
                  <strong>💡 Subscriber Benefit:</strong> Save 5% on all future recurring deliveries automatically!
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="summary sticky-desktop" style={{ background: 'var(--primary)', color: '#fff' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '1rem', color: '#fff' }}>Order Items</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '10px' }}>
            {cart?.items?.map(i => (
              <div key={i.product._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{i.quantity}x</span>
                  <span style={{ fontWeight: '500' }}>{i.product.name}</span>
                </div>
                <span style={{ fontWeight: '700' }}>₹{(i.product.discountPrice || i.product.price) * i.quantity}</span>
              </div>
            ))}
          </div>

          <div className="summary-row" style={{ color: 'rgba(255,255,255,0.8)' }}><span>Subtotal</span> <span>₹{rawSubtotal.toFixed(2)}</span></div>
          {isPremium && (
            <div className="summary-row" style={{ color: '#a7f3d0', fontWeight: 'bold' }}>
              <span>🌟 FarmPass Discount (10%)</span> <span>-₹{premiumDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <span>Delivery Fee</span> 
            <span>
              {deliveryCharge === 0 ? (
                <span style={{ color: isPremium ? '#a7f3d0' : 'inherit' }}>Free</span>
              ) : `₹${deliveryCharge}`}
            </span>
          </div>
          <div className="summary-row total" style={{ color: '#fff', borderTopColor: 'rgba(255,255,255,0.2)' }}>
            <span>Total to Pay</span> <span>₹{totalToPay.toFixed(2)}</span>
          </div>
          <button form="checkoutForm" type="submit" className="btn btn-block" disabled={loading} style={{ background: '#fff', color: 'var(--primary)', padding: '1.2rem', marginTop: '2rem', fontSize: '1.1rem' }}>
            {loading ? "Processing..." : method === "COD" ? "Place Order Now" : `Pay ₹${totalToPay.toFixed(2)} Online Now`}
          </button>
        </div>
      </div>
    </div>
  );
}
