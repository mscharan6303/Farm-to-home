import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FiStar, FiMessageCircle } from "react-icons/fi";

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  const load = async () => {
    const [p, r] = await Promise.all([api.get(`/products/${id}`), api.get(`/reviews/${id}`)]);
    setProduct(p.data); setReviews(r.data);
  };
  useEffect(() => { load(); }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post("/reviews", { productId: id, ...reviewForm });
      toast.success("Review added!");
      setReviewForm({ rating: 5, comment: "" });
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Error"); }
  };

  const openChat = async () => {
    if (!user) return toast.error("Login to chat");
    try {
      const { data: chat } = await api.post("/chat", { userId: product.farmer._id });
      nav("/chat", { state: { activeChat: chat } });
    } catch { toast.error("Could not open chat"); }
  };

  if (!product) return <Loader />;
  const price = product.discountPrice > 0 ? product.discountPrice : product.price;
  const images = product.images?.length ? product.images : [{ url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600" }];

  return (
    <div className="container section">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }} className="product-detail">
        <div>
          <div className="card" style={{ aspectRatio: "1/1" }}>
            <img src={images[activeImg].url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {images.length > 1 && (
            <div className="flex gap-1 mt-2">
              {images.map((img, i) => (
                <img key={i} src={img.url} onClick={() => setActiveImg(i)}
                  style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: activeImg === i ? "2px solid var(--primary)" : "2px solid transparent" }} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex gap-1 mb-2">
            <span className="badge">{product.category}</span>
            {product.organic && <span className="badge badge-organic">Organic</span>}
            {product.seasonal && <span className="badge">Seasonal</span>}
          </div>
          <h1 style={{ marginBottom: ".5rem" }}>{product.name}</h1>
          <div className="muted mb-2">
            by <strong>{product.farmer?.farmName || product.farmer?.name}</strong>
            {product.farmer?.verified && " ✓"}
          </div>
          {product.rating > 0 && (
            <div className="rating mb-2"><FiStar /> {product.rating.toFixed(1)} ({product.numReviews} reviews)</div>
          )}
          <div className="flex gap-2 center mb-2">
            <span style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary-dark)" }}>₹{price}</span>
            <span className="muted">/ {product.unit}</span>
            {product.discountPrice > 0 && <span className="price-old">₹{product.price}</span>}
          </div>
          <p className="muted mb-2">{product.description}</p>
          {product.nutrition && <p className="mb-2"><strong>Nutrition:</strong> {product.nutrition}</p>}
          <p className="mb-2"><strong>Stock:</strong> {product.stock > 0 ? `${product.stock} ${product.unit} available` : "Out of stock"}</p>

          <div className="flex gap-2 center mb-2">
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)}>+</button>
            </div>
            <button className="btn" disabled={product.stock < 1} onClick={() => addToCart(product._id, qty)}>Add to Cart</button>
            <button className="btn btn-outline" onClick={openChat}><FiMessageCircle /> Chat farmer</button>
          </div>
        </div>
      </div>

      <section className="mt-3">
        <h2 style={{ marginBottom: "1rem" }}>Reviews</h2>
        {user && (
          <form onSubmit={submitReview} className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div className="form-group">
              <label>Rating</label>
              <select className="select" value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}>
                {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} stars</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Comment</label>
              <textarea className="textarea" value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
            </div>
            <button className="btn">Submit review</button>
          </form>
        )}
        {reviews.length === 0 ? <p className="muted">No reviews yet.</p> : reviews.map((r) => (
          <div key={r._id} className="card mb-2" style={{ padding: "1rem" }}>
            <div className="flex between center">
              <strong>{r.name}</strong>
              <span className="rating"><FiStar /> {r.rating}</span>
            </div>
            <p className="muted mt-1">{r.comment}</p>
          </div>
        ))}
      </section>

      <style>{`@media (max-width: 800px) { .product-detail { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
