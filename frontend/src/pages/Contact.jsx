import { useState } from "react";
import toast from "react-hot-toast";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return toast.error("Please fill all fields");
    toast.success("Thanks! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  };
  return (
    <div className="container section">
      <h1 className="section-title"><small>Get in touch</small>Contact Us</h1>
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <form onSubmit={submit} className="card" style={{ padding: "2rem" }}>
          <div className="form-group"><label>Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label>Email</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="form-group"><label>Message</label><textarea className="textarea" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
          <button className="btn btn-block">Send message</button>
        </form>
      </div>
    </div>
  );
}
