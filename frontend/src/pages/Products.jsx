import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";
import { FiFilter, FiSearch, FiX } from "react-icons/fi";
import { mockProducts } from "../services/mockData";
import toast from "react-hot-toast";

const CATEGORIES = ["All", "Vegetables", "Fruits", "Leafy Vegetables", "Dairy", "Grains", "Organic Products"];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [showFilters, setShowFilters] = useState(false);

  const category = params.get("category") || "All";
  const keyword = params.get("keyword") || "";
  const sort = params.get("sort") || "-createdAt";
  const page = parseInt(params.get("page") || "1");

  const applyMockFallback = () => {
    let filtered = [...mockProducts];
    if (category !== "All") {
      filtered = filtered.filter((p) => p.category === category);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          p.description.toLowerCase().includes(kw) ||
          p.category.toLowerCase().includes(kw)
      );
    }
    const limit = 12;
    const totalPages = Math.ceil(filtered.length / limit) || 1;
    const startIndex = (page - 1) * limit;
    const pageProducts = filtered.slice(startIndex, startIndex + limit);
    setProducts(pageProducts);
    setPagination({ page, totalPages });
  };

  useEffect(() => {
    setLoading(true);
    let q = `?page=${page}&limit=12&sort=${sort}`;
    if (category !== "All") q += `&category=${encodeURIComponent(category)}`;
    if (keyword) q += `&keyword=${encodeURIComponent(keyword)}`;

    api.get(`/products${q}`)
      .then((r) => {
        if (r.data && Array.isArray(r.data.products) && r.data.products.length > 0) {
          setProducts(r.data.products);
          setPagination({ page: r.data.page || 1, totalPages: r.data.pages || 1 });
        } else {
          applyMockFallback();
        }
      })
      .catch((err) => {
        console.warn("API error on Products page, using mock fallback:", err.message);
        applyMockFallback();
      })
      .finally(() => setLoading(false));
  }, [category, keyword, sort, page]);


  const updateParam = (key, val) => {
    const p = new URLSearchParams(params);
    if (val === "All" || val === "") p.delete(key);
    else p.set(key, val);
    if (key !== "page") p.set("page", "1");
    setParams(p);
  };

  return (
    <div className="container" style={{ padding: "3rem 1.5rem" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.2rem' }}>Fresh Produce</h1>
          <p className="muted">Farm fresh groceries delivered to your door.</p>
        </div>
        <button className="btn btn-outline" onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', gap: '8px' }}>
          {showFilters ? <FiX /> : <FiFilter />} Filters
        </button>
      </div>

      <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
        {/* Sidebar Filters */}
        <div style={{ 
          width: '280px', 
          display: showFilters ? 'block' : 'none', 
        }} className={`sidebar-filters ${showFilters ? 'active' : ''} desktop-sidebar`}>
          <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '100px' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem' }}>Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {CATEGORIES.map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: category === c ? '700' : '500', color: category === c ? 'var(--primary)' : 'var(--text)' }}>
                  <input type="radio" name="cat" checked={category === c} onChange={() => updateParam("category", c)} style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }} />
                  {c}
                </label>
              ))}
            </div>


          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {keyword && (
            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--accent)', borderRadius: 'var(--radius)', color: 'var(--primary)', fontWeight: '600' }}>
              Showing results for "{keyword}"
            </div>
          )}

          {loading ? <Loader /> : products.length === 0 ? (
            <div className="card text-center" style={{ padding: '4rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
              <h3>No products found</h3>
              <p className="muted">Try adjusting your filters or search keywords.</p>
              <button className="btn mt-2" onClick={() => { setParams(new URLSearchParams()); }}>Clear All Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-4 animate-fade-in">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>

              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem' }}>
                  <button 
                    className="btn btn-outline" 
                    disabled={page === 1} 
                    onClick={() => updateParam("page", page - 1)}
                  >Previous</button>
                  <span style={{ padding: '0.8rem 1.2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontWeight: '700' }}>
                    {page} / {pagination.totalPages}
                  </span>
                  <button 
                    className="btn btn-outline" 
                    disabled={page === pagination.totalPages} 
                    onClick={() => updateParam("page", page + 1)}
                  >Next</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
