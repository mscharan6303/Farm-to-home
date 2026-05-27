import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";

const CATS = ["", "Vegetables", "Fruits", "Leafy Vegetables", "Dairy", "Grains", "Organic Products"];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ products: [], pages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/products?${params.toString()}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [params]);

  const update = (key, val) => {
    const p = new URLSearchParams(params);
    if (val) p.set(key, val); else p.delete(key);
    p.set("page", "1");
    setParams(p);
  };

  return (
    <div className="container section">
      <h1 className="section-title"><small>Fresh from the farm</small>All Products</h1>

      <div className="filter-bar">
        <input placeholder="Search..." defaultValue={params.get("keyword") || ""} onBlur={(e) => update("keyword", e.target.value)} />
        <select value={params.get("category") || ""} onChange={(e) => update("category", e.target.value)}>
          {CATS.map((c) => <option key={c} value={c}>{c || "All categories"}</option>)}
        </select>
        <select value={params.get("sort") || ""} onChange={(e) => update("sort", e.target.value)}>
          <option value="">Latest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="best_selling">Best selling</option>
          <option value="rating">Top rated</option>
        </select>
        <label className="flex center gap-1" style={{ marginBottom: 0 }}>
          <input type="checkbox" checked={params.get("organic") === "true"} onChange={(e) => update("organic", e.target.checked ? "true" : "")} />
          Organic only
        </label>
      </div>

      {loading ? <Loader /> : data.products.length === 0 ? (
        <p className="text-center muted">No products found.</p>
      ) : (
        <>
          <div className="grid grid-4">
            {data.products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
          {data.pages > 1 && (
            <div className="flex center gap-2 mt-3" style={{ justifyContent: "center" }}>
              {Array.from({ length: data.pages }).map((_, i) => (
                <button key={i} className={`btn btn-sm ${data.page === i + 1 ? "" : "btn-outline"}`} onClick={() => update("page", i + 1)}>{i + 1}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
