import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";
import { useCart } from "../context/CartContext";
import { FiCheck, FiTruck, FiShield, FiStar, FiMessageSquare } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { mockProducts } from "../services/mockData";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((r) => {
        if (r.data && r.data._id) {
          setProduct(r.data);
        } else {
          const found = mockProducts.find((p) => p._id === id || p.id === id);
          if (found) setProduct(found);
        }
      })
      .catch(() => {
        const found = mockProducts.find((p) => p._id === id || p.id === id);
        if (found) setProduct(found);
      })
      .finally(() => setLoading(false));
  }, [id]);


  if (loading) return <Loader />;
  if (!product) return <div className="container text-center mt-4"><h2>Product not found</h2></div>;

  const handleAdd = () => {
    addToCart(product, qty);
  };


  const handleChat = async () => {
    if (!user) {
      toast.error("Please login to chat with the farmer");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (user._id === product.farmer?._id) {
      toast.error("You cannot chat with yourself!");
      return;
    }
    try {
      const { data } = await api.post("/chat", { userId: product.farmer._id });
      navigate("/chat", { state: { activeChat: data } });
    } catch (err) {
      toast.error("Failed to start chat");
    }
  };

  return (
    <div className="container" style={{ padding: "3rem 1.5rem" }}>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: "2rem", color: "var(--muted)", fontSize: "0.95rem", fontWeight: "500" }}>
        <Link to="/" style={{ color: "var(--muted)" }}>Home</Link> &nbsp; / &nbsp; 
        <Link to={`/products?category=${product.category}`} style={{ color: "var(--muted)" }}>{product.category}</Link> &nbsp; / &nbsp; 
        <span style={{ color: "var(--primary)" }}>{product.name}</span>
      </div>

      <div className="product-layout">
        {/* Image Gallery */}
        <div className="sticky-desktop" style={{ background: "#fff", padding: "3rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <img 
            src={product.images?.length > 0 ? product.images[0].url : "https://placehold.co/600"} 
            alt={product.name} 
            style={{ width: "100%", height: "450px", objectFit: "contain" }} 
            className="animate-fade-in" 
            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/f4f7f5/1b4332?text=${encodeURIComponent(product.name)}`; }}
          />
        </div>

        {/* Product Info */}
        <div className="animate-slide-up">
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {product.organic && <span className="badge badge-organic"><FiCheck /> Certified Organic</span>}
            {product.stock < 10 && product.stock > 0 && <span className="badge badge-discount">Only {product.stock} left!</span>}
          </div>

          <h1 style={{ fontSize: "2.8rem", marginBottom: "0.5rem", fontWeight: "800", lineHeight: "1.2" }}>{product.name}</h1>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
            By <Link to={`/products?keyword=${product.farmer?.name}`} style={{ fontWeight: "700", textDecoration: "underline" }}>{product.farmer?.name}</Link>
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", color: "#f59e0b", fontSize: "1.2rem" }}>
              <FiStar fill="currentColor" /> <FiStar fill="currentColor" /> <FiStar fill="currentColor" /> <FiStar fill="currentColor" /> <FiStar fill="currentColor" />
            </div>
            <span style={{ fontWeight: "600", color: "var(--text)" }}>{product.rating} Rating</span>
            <span style={{ color: "var(--muted)" }}>({product.numReviews} reviews)</span>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontSize: "2.5rem", color: "var(--primary)", fontWeight: "800", fontFamily: "var(--font-heading)", display: "flex", alignItems: "flex-end", gap: "10px" }}>
              ₹{user?.isPremium ? (product.discountPrice || product.price) * 0.9 : (product.discountPrice || product.price)} 
              <span style={{ fontSize: "1.1rem", color: "var(--muted)", fontWeight: "500", paddingBottom: "6px" }}>/ {product.unit}</span>
              {product.discountPrice > 0 && !user?.isPremium && <span className="price-old" style={{ fontSize: "1.2rem", paddingBottom: "6px", marginLeft: "10px" }}>₹{product.price}</span>}
            </div>
            
            {user?.isPremium ? (
              <div style={{ display: 'inline-block', background: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                🌟 FarmPass Member Price (-10%)
              </div>
            ) : (
              <div style={{ display: 'inline-block', background: '#f3f4f6', color: '#4b5563', padding: '4px 10px', borderRadius: '4px', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                🌟 Get it for <strong style={{ color: 'var(--primary)' }}>₹{((product.discountPrice || product.price) * 0.9).toFixed(2)}</strong> with <Link to="/premium" style={{ textDecoration: 'underline' }}>FarmPass</Link>
              </div>
            )}
          </div>

          <p style={{ fontSize: "1.1rem", color: "var(--text)", lineHeight: "1.8", marginBottom: "2.5rem" }}>{product.description}</p>

          {/* Action Area */}
          <div style={{ padding: "2rem", background: "var(--bg-soft)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", marginBottom: "2.5rem" }}>
            {product.stock > 0 ? (
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <div className="qty" style={{ height: "54px", padding: "0 5px", background: "#fff", boxShadow: "var(--shadow-sm)" }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: "0 15px" }}>-</button>
                  <span style={{ fontSize: "1.2rem", width: "40px", display: "inline-block", textAlign: "center" }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{ padding: "0 15px" }}>+</button>
                </div>
                <button className="btn" onClick={handleAdd} style={{ flex: 1, minWidth: "200px", height: "54px", fontSize: "1.1rem" }}>Add to Cart</button>
                <button className="btn" onClick={handleChat} style={{ flex: 1, minWidth: "200px", height: "54px", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#3b82f6", color: "#ffffff", border: "none" }}>
                  <FiMessageSquare /> Chat with Farmer
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexDirection: "column" }}>
                <h3 style={{ color: "var(--danger)", margin: 0, textAlign: "center" }}>Currently Out of Stock</h3>
                <button className="btn" onClick={handleChat} style={{ width: "100%", height: "54px", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#3b82f6", color: "#ffffff", border: "none" }}>
                  <FiMessageSquare /> Chat with Farmer
                </button>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-3" style={{ gap: "1rem" }}>
            <div style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "10px", background: "#fff", borderRadius: "10px", border: "1px solid var(--border)" }}>
              <FiTruck size={24} color="var(--primary)" />
              <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Same Day Delivery</span>
            </div>
            <div style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "10px", background: "#fff", borderRadius: "10px", border: "1px solid var(--border)" }}>
              <FiShield size={24} color="var(--primary)" />
              <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Quality Guaranteed</span>
            </div>
            <div style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "10px", background: "#fff", borderRadius: "10px", border: "1px solid var(--border)" }}>
              <FiStar size={24} color="var(--primary)" />
              <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Direct from Farm</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
