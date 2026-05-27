import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  { name: "Vegetables", emoji: "🥬" },
  { name: "Fruits", emoji: "🍎" },
  { name: "Leafy Vegetables", emoji: "🥗" },
  { name: "Dairy", emoji: "🥛" },
  { name: "Grains", emoji: "🌾" },
  { name: "Organic Products", emoji: "🌱" },
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
      .then((r) => setProducts(r.data.products))
      .finally(() => setLoading(false));
  }, [user, nav]);

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>From Indian farms,<br />straight to your home</h1>
          <p>Fresh vegetables, fruits and grains delivered daily. Direct from farmers — no middlemen, fair prices, full traceability.</p>
          <form className="search" onSubmit={(e) => { e.preventDefault(); nav(`/products?keyword=${q}`); }}>
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
              <span className="emoji">{c.emoji}</span>
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
          <h2 className="section-title"><small>Why farm to home</small>Real benefits</h2>
          <div className="grid grid-3">
            {[
              { e: "🚜", t: "Direct from farmers", d: "Cut out middlemen. Farmers earn fairly, you pay less." },
              { e: "🌿", t: "Picked at peak freshness", d: "Harvested the morning of your delivery." },
              { e: "🇮🇳", t: "Support Indian farmers", d: "Every order supports a verified local farm." },
              { e: "💧", t: "Organic options", d: "Certified organic produce clearly labelled." },
              { e: "📦", t: "Quick delivery", d: "Same-day delivery in select cities." },
              { e: "💬", t: "Talk to your farmer", d: "Chat directly with the farmer who grew your food." },
            ].map((b) => (
              <div className="card" key={b.t} style={{ padding: "1.5rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>{b.e}</div>
                <h3 style={{ fontSize: "1.1rem", marginBottom: ".4rem" }}>{b.t}</h3>
                <p className="muted">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section container">
        <h2 className="section-title"><small>What our customers say</small>Testimonials</h2>
        <div className="grid grid-3">
          {[
            { n: "Priya Sharma", c: "Delhi", t: "The tomatoes taste like the ones from my grandmother's village. Unreal quality." },
            { n: "Rohit Kumar", c: "Bangalore", t: "I love chatting with the farmer. Feels like a real connection, not just a shop." },
            { n: "Anita Reddy", c: "Hyderabad", t: "Switched fully from supermarket. Cheaper, fresher, and I sleep better knowing farmers earn fairly." },
          ].map((t) => (
            <div className="card" key={t.n} style={{ padding: "1.5rem" }}>
              <p style={{ fontStyle: "italic", marginBottom: "1rem" }}>"{t.t}"</p>
              <strong>{t.n}</strong>
              <div className="muted" style={{ fontSize: ".85rem" }}>{t.c}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
