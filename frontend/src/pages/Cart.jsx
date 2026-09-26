import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { FiTrash2, FiShoppingBag, FiArrowRight } from "react-icons/fi";
import toast from "react-hot-toast";

export default function Cart() {
  const { cart, updateQty, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const isPremium = user?.isPremium;
  const nav = useNavigate();

  if (!cart?.items?.length) {
    return (
      <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'var(--bg-soft)', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
          <FiShoppingBag size={50} color="var(--primary)" />
        </div>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Your Cart is Empty</h2>
        <p className="muted" style={{ fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '400px' }}>Looks like you haven't added any fresh produce to your cart yet.</p>
        <Link to="/products" className="btn" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>Start Shopping</Link>
      </div>
    );
  }

  const rawSubtotal = cart.items.reduce((acc, i) => acc + (i.product.discountPrice || i.product.price) * i.quantity, 0);
  const premiumDiscount = isPremium ? rawSubtotal * 0.10 : 0;
  const deliveryFee = isPremium ? 0 : (rawSubtotal > 300 ? 0 : 49);
  const finalTotal = rawSubtotal - premiumDiscount + deliveryFee;

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Shopping Cart</h1>
      
      <div className="cart-layout">
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Cart Items ({cart.items.length})</h3>
            <button onClick={() => clearCart()} style={{ background: 'transparent', color: 'var(--danger)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}><FiTrash2 /> Clear All</button>
          </div>
          
          {cart.items.map(item => (
            <div key={item.product._id} style={{ display: 'flex', gap: '1.5rem', padding: '2rem 1.5rem', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <img 
                src={item.product.images?.[0]?.url} 
                alt={item.product.name} 
                style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', background: 'var(--bg-soft)', padding: '0.5rem' }} 
                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/f4f7f5/1b4332?text=${encodeURIComponent(item.product.name)}`; }}
              />
              
              <div style={{ flex: 1 }}>
                <Link to={`/products/${item.product._id}`} style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text)', display: 'block', marginBottom: '0.2rem' }}>{item.product.name}</Link>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Sold per {item.product.unit}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div className="qty" style={{ height: '40px' }}>
                    <button onClick={() => updateQty(item.product._id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.product._id, item.quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.product._id)} style={{ background: 'transparent', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: '500' }}>Remove</button>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                  ₹{(isPremium ? ((item.product.discountPrice || item.product.price) * 0.9 * item.quantity) : ((item.product.discountPrice || item.product.price) * item.quantity)).toFixed(2)}
                </div>
                {isPremium && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Includes FarmPass 10% Off</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="summary sticky-desktop" style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Order Summary</h3>
          <div className="summary-row"><span>Subtotal</span> <span style={{ fontWeight: '600', color: 'var(--text)' }}>₹{rawSubtotal.toFixed(2)}</span></div>
          {isPremium && (
            <div className="summary-row" style={{ color: 'var(--primary)' }}>
              <span>🌟 FarmPass Savings</span> 
              <span style={{ fontWeight: '600' }}>- ₹{premiumDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Delivery Fee</span> 
            <span style={{ color: 'var(--leaf)', fontWeight: '600' }}>
              {deliveryFee === 0 ? (isPremium ? "Free (FarmPass)" : "Free") : `₹${deliveryFee.toFixed(2)}`}
            </span>
          </div>
          {rawSubtotal > 0 && rawSubtotal <= 300 && !isPremium && (
            <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.5rem', fontWeight: '500', background: 'var(--bg-soft)', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
              🚚 Add ₹{(300 - rawSubtotal + 1).toFixed(0)} more items for <strong>FREE Delivery</strong>!
            </div>
          )}
          <div className="summary-row total" style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>
            <span>Total</span> <span>₹{finalTotal.toFixed(2)}</span>
          </div>
          <button className="btn btn-block" onClick={() => nav("/checkout")} style={{ padding: '1.2rem', marginTop: '2rem', fontSize: '1.1rem', gap: '10px' }}>
            Proceed to Checkout <FiArrowRight />
          </button>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/products" style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: '500' }}>or Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
