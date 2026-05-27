import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

const CATEGORIES = [
  { value: "Vegetables", label: "Vegetables" },
  { value: "Fruits", label: "Fruits" },
  { value: "Leafy Vegetables", label: "Leafy Vegetables" },
  { value: "Dairy", label: "Dairy" },
  { value: "Grains", label: "Grains" },
  { value: "Organic Products", label: "Organic Products" },
];

export default function AddProduct() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "", category: "Vegetables", description: "", price: "", discountPrice: "",
    stock: "", unit: "kg", organic: false, seasonal: false, nutrition: "",
  });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append("images", f));
      await api.post("/products", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Product added");
      nav("/farmer/products");
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="container dash">
      <aside className="sidebar">
        <Link to="/farmer">Overview</Link>
        <Link to="/farmer/products">My Products</Link>
        <Link to="/farmer/products/new" className="active">Add Product</Link>
        <Link to="/farmer/orders?status=current">Current Orders</Link>
        <Link to="/farmer/orders?status=delivered">Delivered Orders</Link>
      </aside>
      <div>
        <h1 className="mb-2">Add Product</h1>
        <form onSubmit={submit} className="card" style={{ padding: "1.5rem", maxWidth: 720 }}>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="form-group"><label>Name</label><input className="input" list="indian-products" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <datalist id="indian-products">
              <option value="Tomato"></option>
              <option value="Potato"></option>
              <option value="Onion"></option>
              <option value="Cabbage"></option>
              <option value="Cauliflower"></option>
              <option value="Brinjal"></option>
              <option value="Okra"></option>
              <option value="Spinach"></option>
              <option value="Milk"></option>
              <option value="Rice"></option>
              <option value="Wheat"></option>
              <option value="Mango"></option>
              <option value="Banana"></option>
              <option value="Apple"></option>
            </datalist>
            <div className="form-group"><label>Category</label>
              <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Price (₹)</label><input className="input" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="form-group"><label>Discount price (₹)</label><input className="input" type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} /></div>
            <div className="form-group"><label>Stock</label><input className="input" type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            <div className="form-group"><label>Unit</label>
              <select className="select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="kg">kg (Kilograms)</option>
                <option value="L">L (Litres)</option>
                <option value="pc">pc (Pieces)</option>
                <option value="dozen">Dozen</option>
                <option value="bunch">Bunch</option>
                <option value="pack">Pack</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Description</label><textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-group"><label>Nutrition info</label><textarea className="textarea" value={form.nutrition} onChange={(e) => setForm({ ...form, nutrition: e.target.value })} /></div>
          <div className="flex gap-3 mb-2">
            <label className="flex center gap-1"><input type="checkbox" checked={form.organic} onChange={(e) => setForm({ ...form, organic: e.target.checked })} /> Organic</label>
            <label className="flex center gap-1"><input type="checkbox" checked={form.seasonal} onChange={(e) => setForm({ ...form, seasonal: e.target.checked })} /> Seasonal</label>
          </div>
          <div className="form-group">
            <label>Images (up to 5)</label>
            <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))} />
          </div>
          <button className="btn" disabled={busy}>{busy ? "Saving..." : "Add product"}</button>
        </form>
      </div>
    </div>
  );
}
