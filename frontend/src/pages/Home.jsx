import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { mockProducts } from "../services/mockData";

const CATEGORIES = [
  { name: "Vegetables", img: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=200&h=200&fit=crop" },
  { name: "Fruits", img: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=200&h=200&fit=crop" },
  { name: "Leafy Vegetables", img: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&h=200&fit=crop" },
  { name: "Dairy", img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop" },
  { name: "Grains", img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&h=200&fit=crop" },
  { name: "Organic Products", img: "https://images.unsplash.com/photo-1611843467160-25afb8df1074?w=200&h=200&fit=crop" },
];

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    if (user?.role === "farmer") {
      nav("/farmer", { replace: true });
      return;
    }
    api.get("/products?limit=8&sort=best_selling")
      .then((r) => {
        if (r.data && Array.isArray(r.data.products) && r.data.products.length > 0) {
          setProducts(r.data.products);
        } else {
          setProducts(mockProducts.slice(0, 8));
        }
      })
      .catch((err) => {
        console.warn("API error on Home page, using mock fallback:", err.message);
        setProducts(mockProducts.slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, [user, nav]);


  return (
    <>
      <section className="hero">
        <div className="container">
          <h1 className="animate-slide-up">From Indian farms,<br />straight to <span>your home</span></h1>
          <p className="animate-slide-up" style={{animationDelay: '0.1s'}}>Fresh vegetables, fruits and grains delivered daily. Direct from farmers — no middlemen, fair prices, full traceability.</p>
          <form className="search animate-slide-up" style={{animationDelay: '0.2s'}} onSubmit={(e) => { e.preventDefault(); nav(`/products?keyword=${q}`); }}>
            <input placeholder="Search tomatoes, mangoes, organic rice..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn" type="submit">Search</button>
          </form>
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title"><small>Shop by</small>Categories</h2>
        <div className="cats">
          {CATEGORIES.map((c) => (
            <Link key={c.name} to={`/products?category=${encodeURIComponent(c.name)}`} className="cat">
              <img src={c.img} alt={c.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }} />
              <strong>{c.name}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title"><small>This week's</small>Featured Produce</h2>
        {loading ? <Loader /> : (
          <div className="grid grid-4">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
        <div className="text-center mt-3">
          <Link to="/products" className="btn btn-outline">View all products</Link>
        </div>
      </section>

      <section className="section" style={{ background: "var(--bg-soft)" }}>
        <div className="container">
          <h2 className="section-title animate-slide-up"><small>Why farm to home</small>Real benefits</h2>
          <div className="grid grid-3 animate-slide-up" style={{animationDelay: '0.1s'}}>
            {[
              { e: "🚜", t: "Direct from farmers", d: "Cut out middlemen. Farmers earn fairly, you pay less." },
              { e: "🌿", t: "Picked at peak freshness", d: "Harvested the morning of your delivery." },
              { e: "🇮🇳", t: "Support Indian farmers", d: "Every order supports a verified local farm." },
              { e: "💧", t: "Organic options", d: "Certified organic produce clearly labelled." },
              { e: "📦", t: "Quick delivery", d: "Same-day delivery in select cities." }
            ].map((b) => (
              <div className="feature-card" key={b.t}>
                <div className="icon-wrap">{b.e}</div>
                <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>{b.t}</h3>
                <p className="muted">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title animate-slide-up"><small>What our customers say</small>Customer Reviews</h2>
        <div className="grid grid-3 animate-slide-up" style={{animationDelay: '0.2s'}}>
          {[
            { n: "Priya Sharma", c: "Delhi", t: "The tomatoes taste like the ones from my grandmother's village. Unreal quality." },
            { n: "Anita Reddy", c: "Hyderabad", t: "Switched fully from supermarket. Cheaper, fresher, and I sleep better knowing farmers earn fairly." },
            { n: "Vikram Singh", c: "Mumbai", t: "The organic mangoes I received were absolutely phenomenal. Best produce delivery service in India!" },
            { n: "Sneha Patel", c: "Ahmedabad", t: "Finally a platform that respects the farmers and provides true organic quality. The Jowar and Bajra are so fresh." },
            { n: "Karthik N.", c: "Chennai", t: "Prompt delivery and the veggies actually last longer in the fridge because they are harvested the same day." }
          ].map((t) => (
            <div className="feature-card" key={t.n}>
              <div style={{color: '#f59e0b', fontSize: '1.2rem', marginBottom: '0.8rem'}}>⭐⭐⭐⭐⭐</div>
              <p style={{ fontStyle: "italic", marginBottom: "1.5rem", fontSize: '1.05rem', color: 'var(--text)' }}>"{t.t}"</p>
              <strong style={{color: 'var(--primary)', display: 'block'}}>{t.n}</strong>
              <div className="muted" style={{ fontSize: "0.85rem", marginTop: '0.2rem' }}>{t.c}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
