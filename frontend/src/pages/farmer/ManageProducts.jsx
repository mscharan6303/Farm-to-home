import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { mockProducts } from "../../services/mockData";

export default function ManageProducts() {
  const [items, setItems] = useState([]);

  const load = () => {
    api.get("/products/farmer/mine")
      .then((r) => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          const backendIds = new Set(r.data.map(p => p._id || p.id));
          const missingMock = mockProducts.filter(m => !backendIds.has(m._id) && !backendIds.has(m.id));
          setItems([...r.data, ...missingMock]);
        } else {
          setItems(mockProducts);
        }
      })
      .catch((err) => {
        console.warn("API getMyProducts failed, using mockProducts list:", err);
        setItems(mockProducts);
      });
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`).catch(() => {});
    } catch(e) {}
    setItems(prev => prev.filter(p => p._id !== id && p.id !== id));
    toast.success("Product deleted successfully");
  };

  return (
    <div className="container dash" style={{ padding: '3rem 1.5rem' }}>
      <aside className="sidebar">
        <Link to="/farmer">Overview</Link>
        <Link to="/farmer/products" className="active">My Products ({items.length})</Link>
        <Link to="/farmer/products/new">Add Product</Link>
        <Link to="/farmer/orders?status=current">Current Orders</Link>
        <Link to="/farmer/orders?status=delivered">Delivered Orders</Link>
        <Link to="/farmer/profile">Profile</Link>
      </aside>
      <div style={{ flex: 1 }}>
        <div className="flex between center mb-2">
          <div>
            <h1>My Products ({items.length})</h1>
            <p className="muted">All products associated with <strong>farmer@demo.com</strong></p>
          </div>
          <Link to="/farmer/products/new" className="btn">+ Add Product</Link>
        </div>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-soft)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Image</th>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>Category</th>
                <th style={{ padding: '12px' }}>Price</th>
                <th style={{ padding: '12px' }}>Stock</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const imgUrl = p.images?.[0]?.url || p.image || 'https://placehold.co/40x40/f4f7f5/1b4332?text=Img';
                return (
                  <tr key={p._id || p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px' }}>
                      <img src={imgUrl} alt={p.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
                    </td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{p.name}</td>
                    <td style={{ padding: '10px' }}>{p.category}</td>
                    <td style={{ padding: '10px', color: 'var(--primary)', fontWeight: 'bold' }}>₹{p.discountPrice || p.price}</td>
                    <td style={{ padding: '10px' }}>{p.stock || 50} kg</td>
                    <td style={{ padding: '10px' }}>
                      <div className="flex gap-1">
                        <Link to={`/farmer/products/${p._id || p.id}/edit`} className="btn btn-sm btn-outline">Edit</Link>
                        <button className="btn btn-sm btn-danger" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }} onClick={() => remove(p._id || p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
