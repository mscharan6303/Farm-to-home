import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "", address: user.address || "", farmName: user.farmName || "" });
  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put("/auth/profile", form);
      updateUser(res.data);
      toast.success("Profile updated");
    } catch { toast.error("Failed"); }
  };
  return (
    <div className="container section" style={{ maxWidth: 600 }}>
      <h1 className="mb-2">My Profile</h1>
      <form className="card" style={{ padding: "1.5rem" }} onSubmit={submit}>
        <div className="form-group"><label>Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="form-group"><label>Address</label><textarea className="textarea" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        {user.role === "farmer" && (
          <div className="form-group"><label>Farm name</label><input className="input" value={form.farmName} onChange={(e) => setForm({ ...form, farmName: e.target.value })} /></div>
        )}
        <button className="btn">Save</button>
      </form>
    </div>
  );
}
