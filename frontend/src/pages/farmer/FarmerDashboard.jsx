import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getLocalFarmerOrders, getEffectiveProducts } from "../../services/api";
import { mockProducts } from "../../services/mockData";
import { subscribeToSyncEvents, notifySyncListeners } from "../../services/cloudSync";
import toast from "react-hot-toast";
import { FiVideo, FiPlus, FiTrash2, FiClock, FiX, FiPlay } from "react-icons/fi";

const SAMPLE_VIDEOS = [
  { label: "🚜 Farm Harvest (Sample 1)", url: "https://assets.mixkit.co/videos/preview/mixkit-farmer-hands-holding-fresh-tomatoes-42984-large.mp4" },
  { label: "🌾 Green Vegetables Farm (Sample 2)", url: "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-fresh-carrots-42985-large.mp4" },
  { label: "🍎 Fresh Fruit Orchard (Sample 3)", url: "https://assets.mixkit.co/videos/preview/mixkit-man-harvesting-apples-in-an-orchard-42988-large.mp4" },
];

export default function FarmerDashboard() {
  const [stats, setStats] = useState({ products: mockProducts.length, orders: 0, revenue: 0 });
  const [isAvailable, setIsAvailable] = useState(() => {
    try {
      const stored = localStorage.getItem("farmer_availability_status");
      return stored !== null ? JSON.parse(stored) : true;
    } catch (e) { return true; }
  });

  const [productsList, setProductsList] = useState([]);
  const [myAds, setMyAds] = useState([]);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adForm, setAdForm] = useState({
    title: "",
    videoUrl: SAMPLE_VIDEOS[0].url,
    productId: "",
    durationDays: 7,
  });

  const toggleAvailability = (val) => {
    setIsAvailable(val);
    try {
      localStorage.setItem("farmer_availability_status", JSON.stringify(val));
    } catch (e) {}
  };

  const loadStatsAndAds = async () => {
    let pList = getEffectiveProducts();
    setProductsList(pList);
    let pCount = pList.length;
    let oCount = 0;
    let revenue = 0;

    try {
      const [p, o] = await Promise.all([
        api.get("/products/farmer/mine").catch(() => ({ data: [] })),
        api.get("/orders/farmer/received").catch(() => ({ data: [] }))
      ]);

      if (Array.isArray(p.data) && p.data.length > 0) {
        pCount = Math.max(p.data.length, pList.length);
      }

      let orderList = Array.isArray(o.data) ? [...o.data] : [];
      const local = await getLocalFarmerOrders();
      const seen = new Set(orderList.map(x => x._id));
      local.forEach(l => {
        if (!seen.has(l._id)) {
          seen.add(l._id);
          orderList.push(l);
        }
      });

      oCount = orderList.length;
      revenue = orderList.reduce((s, x) => s + (x.totalPrice || 0), 0);
    } catch (e) {
      console.warn("Dashboard stats fetch fallback:", e);
      const local = await getLocalFarmerOrders();
      oCount = local.length;
      revenue = local.reduce((s, x) => s + (x.totalPrice || 0), 0);
    }

    setStats({ products: pCount, orders: oCount, revenue });

    // Load active video ads
    try {
      const raw = localStorage.getItem("farmer_video_ads");
      const ads = raw ? JSON.parse(raw) : [];
      setMyAds(ads);
    } catch (e) {}
  };

  useEffect(() => {
    loadStatsAndAds();
    const unsubscribe = subscribeToSyncEvents(() => {
      loadStatsAndAds();
    });
    return () => unsubscribe();
  }, []);

  const handleOpenAdModal = () => {
    const firstProd = productsList[0] || mockProducts[0];
    setAdForm({
      title: "",
      videoUrl: SAMPLE_VIDEOS[0].url,
      productId: firstProd?._id || firstProd?.id || "",
      durationDays: 7,
    });
    setShowAdModal(true);
  };

  const handleCreateAd = (e) => {
    e.preventDefault();
    if (!adForm.title.trim()) {
      toast.error("Please enter a video ad title");
      return;
    }

    const selProd = productsList.find((p) => (p._id || p.id) === adForm.productId) || productsList[0] || mockProducts[0];

    const durationDays = Number(adForm.durationDays || 7);
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const newAd = {
      id: `ad_${Date.now()}`,
      farmerName: "Demo Organic Farmer",
      farmerEmail: "farmer@demo.com",
      title: adForm.title.trim(),
      videoUrl: adForm.videoUrl || SAMPLE_VIDEOS[0].url,
      productId: selProd?._id || selProd?.id,
      product: {
        _id: selProd?._id || selProd?.id,
        name: selProd?.name,
        price: selProd?.price,
        discountPrice: selProd?.discountPrice || selProd?.price,
        images: selProd?.images || [{ url: selProd?.image || "/images/aloo.png" }],
        unit: selProd?.unit || "kg"
      },
      durationDays,
      createdAt,
      expiresAt
    };

    try {
      let adsList = [];
      try {
        adsList = JSON.parse(localStorage.getItem("farmer_video_ads") || "[]");
      } catch (err) {}

      adsList.unshift(newAd);
      localStorage.setItem("farmer_video_ads", JSON.stringify(adsList));
      toast.success(`Video Ad published! Will show on customer dashboard for ${durationDays} days. 📹`);
      setShowAdModal(false);
      loadStatsAndAds();
      notifySyncListeners();
    } catch (err) {
      toast.error("Failed to publish video ad");
    }
  };

  const handleDeleteAd = (adId) => {
    if (!confirm("Are you sure you want to remove this video ad?")) return;
    try {
      let adsList = JSON.parse(localStorage.getItem("farmer_video_ads") || "[]");
      adsList = adsList.filter((a) => a.id !== adId);
      localStorage.setItem("farmer_video_ads", JSON.stringify(adsList));
      toast.success("Video ad removed");
      loadStatsAndAds();
      notifySyncListeners();
    } catch (e) {
      toast.error("Failed to delete video ad");
    }
  };

  return (
    <div className="container dash" style={{ padding: '3rem 1.5rem' }}>
      <aside className="sidebar">
        <Link to="/farmer" className="active">Overview</Link>
        <Link to="/farmer/products">My Products ({stats.products})</Link>
        <Link to="/farmer/products/new">Add Product</Link>
        <Link to="/farmer/orders?status=all">All Orders Received ({stats.orders})</Link>
        <Link to="/farmer/orders?status=delivered">Delivered Orders</Link>
        <Link to="/farmer/orders?status=cancelled">Cancelled Orders</Link>
        <Link to="/farmer/profile">Profile</Link>
      </aside>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="mb-1" style={{ fontSize: '2rem' }}>Farmer Dashboard 🚜</h1>
            <p className="muted" style={{ margin: 0 }}>Account: <strong>farmer@demo.com</strong></p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="btn"
              onClick={handleOpenAdModal}
              style={{ background: "#8b5cf6", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FiVideo /> 📢 Create Video Ad
            </button>

            {/* Availability Toggle Box */}
            <div style={{ background: isAvailable ? '#ecfdf5' : '#fef2f2', border: isAvailable ? '1px solid #a7f3d0' : '1px solid #fca5a5', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: isAvailable ? '#065f46' : '#991b1b' }}>
                  {isAvailable ? "🟢 Harvesting Active" : "🔴 Harvesting Paused"}
                </strong>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isAvailable} 
                  onChange={(e) => toggleAvailability(e.target.checked)} 
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', inset: 0, background: isAvailable ? 'var(--primary)' : '#ccc', borderRadius: '34px', transition: '0.4s'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: '16px', width: '16px', left: isAvailable ? '24px' : '4px', bottom: '4px', background: '#fff', borderRadius: '50%', transition: '0.4s'
                  }}></span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
          <div className="stat">
            <div className="label">Products Listed</div>
            <div className="value">{stats.products}</div>
          </div>

          <div className="stat">
            <div className="label">Orders Received</div>
            <div className="value">{stats.orders}</div>
          </div>

          <div className="stat">
            <div className="label">Gross Sales</div>
            <div className="value">₹{Number(stats.revenue).toFixed(2)}</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>Before platform fee</span>
          </div>

          <div className="stat" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
            <div className="label" style={{ color: '#065f46', fontWeight: 'bold' }}>Net Earnings (90% Take-Home)</div>
            <div className="value" style={{ color: '#15803d' }}>₹{(stats.revenue * 0.90).toFixed(2)}</div>
            <span style={{ fontSize: '0.78rem', color: '#166534', display: 'block', marginTop: '4px', fontWeight: '500' }}>
              Deducted 10% platform commission (₹{(stats.revenue * 0.10).toFixed(2)})
            </span>
          </div>
        </div>

        {/* Active Promotional Video Ads Section */}
        <div style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.4rem", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <FiVideo color="#8b5cf6" /> Promotional Farm Video Ads ({myAds.length})
            </h2>
            <button className="btn btn-sm btn-outline" onClick={handleOpenAdModal}>
              + Create Ad
            </button>
          </div>

          {myAds.length === 0 ? (
            <div className="card text-center" style={{ padding: "2rem", borderStyle: "dashed" }}>
              <p className="muted" style={{ margin: 0 }}>
                No video ads created yet. Create a promotional video ad to showcase your farm produce directly on the customer home page!
              </p>
              <button className="btn btn-sm" onClick={handleOpenAdModal} style={{ marginTop: "1rem", background: "#8b5cf6", color: "#fff" }}>
                Create Your First Video Ad 📹
              </button>
            </div>
          ) : (
            <div className="grid grid-2" style={{ gap: "1rem" }}>
              {myAds.map((ad) => {
                const isExpired = new Date(ad.expiresAt) <= new Date();
                const daysRemaining = Math.max(0, Math.ceil((new Date(ad.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)));
                return (
                  <div key={ad.id} className="card" style={{ padding: "1.2rem", borderLeft: isExpired ? "4px solid #ef4444" : "4px solid #8b5cf6" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <strong style={{ fontSize: "1.1rem", display: "block" }}>{ad.title}</strong>
                        <span style={{ fontSize: "0.82rem", color: "var(--muted)", display: "block", marginTop: "2px" }}>
                          Promoting: <strong>{ad.product?.name || "Product"}</strong>
                        </span>
                      </div>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleDeleteAd(ad.id)}
                        style={{ background: "#fee2e2", color: "#b91c1c", border: "none", padding: "4px 8px" }}
                        title="Delete Ad"
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                    <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                      <span className={`badge ${isExpired ? "badge-danger" : "badge-organic"}`}>
                        {isExpired ? "Expired ❌" : `Active ✅ (${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} left)`}
                      </span>
                      <span style={{ color: "var(--muted)" }}>Duration: {ad.durationDays} Days</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- CREATE VIDEO AD MODAL --- */}
      {showAdModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="animate-scale-up" style={{ background: "#fff", width: "100%", maxWidth: "520px", borderRadius: "var(--radius-md)", padding: "2rem", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                📹 Create Promotional Video Ad
              </h3>
              <button onClick={() => setShowAdModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateAd} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Ad Title / Caption *</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: "100%" }}
                  value={adForm.title}
                  onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                  placeholder="e.g. Watch Our Fresh Morning Tomato Harvest! 🚜"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Select Product to Promote *</label>
                <select
                  className="input"
                  style={{ width: "100%" }}
                  value={adForm.productId}
                  onChange={(e) => setAdForm({ ...adForm, productId: e.target.value })}
                >
                  {productsList.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name} — ₹{p.discountPrice || p.price} / {p.unit || "kg"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Select Ad Video Source *</label>
                <select
                  className="input"
                  style={{ width: "100%", marginBottom: "8px" }}
                  value={adForm.videoUrl}
                  onChange={(e) => setAdForm({ ...adForm, videoUrl: e.target.value })}
                >
                  {SAMPLE_VIDEOS.map((sv) => (
                    <option key={sv.url} value={sv.url}>{sv.label}</option>
                  ))}
                  <option value="custom">Custom MP4 Video / YouTube URL...</option>
                </select>

                <input
                  type="text"
                  className="input"
                  style={{ width: "100%" }}
                  value={adForm.videoUrl}
                  onChange={(e) => setAdForm({ ...adForm, videoUrl: e.target.value })}
                  placeholder="Paste direct .mp4 video URL or YouTube URL"
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Select Ad Active Duration (Number of Days to Show on Website) *</label>
                <select
                  className="input"
                  style={{ width: "100%" }}
                  value={adForm.durationDays}
                  onChange={(e) => setAdForm({ ...adForm, durationDays: e.target.value })}
                >
                  <option value="1">1 Day</option>
                  <option value="3">3 Days</option>
                  <option value="7">7 Days (1 Week)</option>
                  <option value="15">15 Days</option>
                  <option value="30">30 Days (1 Month)</option>
                </select>
                <span style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginTop: "4px" }}>
                  Ad will automatically stay active on the customer dashboard for the selected number of days.
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                <button type="submit" className="btn" style={{ background: "#8b5cf6", color: "#fff", flex: 1 }}>
                  Publish Video Ad 🚀
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowAdModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
