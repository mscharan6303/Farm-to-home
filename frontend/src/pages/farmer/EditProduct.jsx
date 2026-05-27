import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";

export default function EditProduct() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState(null);

  useEffect(() => { api.get(`/products/${id}`).then((r) => setForm(r.data)); }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/products/${id}`, form);
      toast.success("Updated");
      nav("/farmer/products");
    } catch { toast.error("Failed"); }
  };

  if (!form) return <Loader />;
  return (
    <div className="container dash">
      <aside className="sidebar">
        <Link to="/farmer">Overview</Link>
        <Link to="/farmer/products" className="active">My Products</Link>
        <Link to="/farmer/products/new">Add Product</Link>
        <Link to="/farmer/orders?status=current">Current Orders</Link>
        <Link to="/farmer/orders?status=delivered">Delivered Orders</Link>
      </aside>
      <div>
        <h1 className="mb-2">Edit Product</h1>
        <form onSubmit={submit} className="card" style={{ padding: "1.5rem", maxWidth: 720 }}>
          <div className="form-group"><label>Name</label><input className="input" list="indian-products" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
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
          <div className="form-group"><label>Price (₹)</label><input className="input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
          <div className="form-group"><label>Discount price (₹)</label><input className="input" type="number" value={form.discountPrice || 0} onChange={(e) => setForm({ ...form, discountPrice: Number(e.target.value) })} /></div>
          <div className="form-group"><label>Stock</label><input className="input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          <div className="form-group"><label>Description</label><textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <button className="btn">Save changes</button>
        </form>
      </div>
    </div>
  );
}
