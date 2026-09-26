import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isPremium = user?.isPremium;
  const basePrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const displayPrice = isPremium ? basePrice * 0.9 : basePrice;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };


  return (
    <Link to={`/products/${product._id}`} className="product-card">
      <div className="img">
        <div className="badges">
          {product.organic && <span className="badge badge-organic">Organic</span>}
          {product.discountPrice > 0 && <span className="badge badge-discount">Offer</span>}
        </div>
        <img 
          src={product.images?.length > 0 ? product.images[0].url : "https://placehold.co/400"} 
          alt={product.name} 
          onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/f4f7f5/1b4332?text=${encodeURIComponent(product.name)}`; }}
        />
      </div>
      <div className="body">
        <div className="farmer">🚜 {product.farmer?.name || "Verified Farm"}</div>
        <h4>{product.name}</h4>
        <div className="rating" style={{ marginBottom: "0.5rem" }}>
          ⭐⭐⭐⭐⭐ <span className="muted" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{product.rating} ({product.numReviews})</span>
        </div>
        <div className="price">
          <span className="price-main">₹{Math.round(displayPrice)}</span>
          {isPremium ? (
            <span style={{ fontSize: "0.75rem", background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', marginLeft: '6px', verticalAlign: 'middle' }}>-10%</span>
          ) : (
            product.discountPrice > 0 && <span className="price-old" style={{ marginLeft: '6px' }}>₹{Math.round(product.price)}</span>
          )}
          <span className="muted" style={{ fontSize: "0.85rem", fontWeight: "normal", marginLeft: '4px' }}>/ {product.unit}</span>
        </div>
        <button className="btn mt-2" onClick={handleAdd} style={{ width: "100%", marginTop: "1rem" }}>
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
