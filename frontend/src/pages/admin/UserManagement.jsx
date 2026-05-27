import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const load = () => api.get("/admin/users").then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);
  const verify = async (id) => { await api.put(`/admin/users/${id}/verify`); load(); };
  const remove = async (id) => {
    if (!confirm("Delete user?")) return;
    await api.delete(`/admin/users/${id}`);
    toast.success("Removed"); load();
  };
  return (
    <div className="container dash">
      <aside className="sidebar">
        <Link to="/admin">Overview</Link>
        <Link to="/admin/users" className="active">Users</Link>
        <Link to="/admin/orders">Orders</Link>
      </aside>
      <div>
        <h1 className="mb-2">Users</h1>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th></th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td><td>{u.email}</td><td>{u.role}</td>
              <td>{u.verified ? "✓" : "—"}</td>
              <td className="flex gap-1">
                {u.role === "farmer" && <button className="btn btn-sm btn-outline" onClick={() => verify(u._id)}>{u.verified ? "Unverify" : "Verify"}</button>}
                <button className="btn btn-sm btn-danger" onClick={() => remove(u._id)}>Delete</button>
              </td>
            </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
