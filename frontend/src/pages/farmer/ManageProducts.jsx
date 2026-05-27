import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function ManageProducts() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/products/farmer/mine").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);
  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    await api.delete(`/products/${id}`);
    toast.success("Deleted");
    load();
  };
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
        <div className="flex between center mb-2">
          <h1>My Products</h1>
          <Link to="/farmer/products/new" className="btn">+ Add product</Link>
        </div>
        <table>
          <thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th></th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p._id}>
                <td><img src={p.images[0]?.url || "https://via.placeholder.com/40"} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} /></td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>₹{p.price}</td>
                <td>{p.stock}</td>
                <td>{p.sold}</td>
                <td className="flex gap-1">
                  <Link to={`/farmer/products/${p._id}/edit`} className="btn btn-sm btn-outline">Edit</Link>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
