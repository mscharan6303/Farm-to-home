import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import { FiPlay, FiPause, FiShoppingCart, FiArrowRight, FiCheckCircle, FiClock, FiVideo } from "react-icons/fi";
import { subscribeToSyncEvents } from "../services/cloudSync";

export function getActiveVideoAds() {
  try {
    const raw = localStorage.getItem("farmer_video_ads");
    if (!raw) return [];
    const ads = JSON.parse(raw);
    const now = new Date();
    return ads.filter((ad) => ad && ad.expiresAt && new Date(ad.expiresAt) > now);
  } catch (e) {
    return [];
  }
}

export default function FarmerVideoAds() {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);
  const { addToCart } = useCart();
  const nav = useNavigate();

  const refreshAds = () => {
    const activeList = getActiveVideoAds();
    setAds(activeList);
  };

  useEffect(() => {
    refreshAds();
    const unsub = subscribeToSyncEvents(refreshAds);
    const interval = setInterval(refreshAds, 5000);
    window.addEventListener("storage", refreshAds);

    return () => {
      unsub();
      clearInterval(interval);
      window.removeEventListener("storage", refreshAds);
    };
  }, []);

  useEffect(() => {
    if (currentIndex >= ads.length && ads.length > 0) {
      setCurrentIndex(0);
    }
  }, [ads]);

  // If NO ads are active, keep the customer dashboard completely clean!
  if (!ads || ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentIndex] || ads[0];

  const handleNextAd = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const handlePrevAd = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const handleVideoEnded = () => {
    if (ads.length > 1) {
      handleNextAd();
    } else if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!currentAd.product) {
      toast.error("Product details unavailable for this ad");
      return;
    }
    addToCart(currentAd.product, 1);
    toast.success(`Added ${currentAd.product.name} to cart! 🛒`);
  };

  const handleDirectOrder = (e) => {
    e.stopPropagation();
    if (!currentAd.product) return;
    addToCart(currentAd.product, 1);
    nav("/cart");
  };

  const daysLeft = currentAd.expiresAt
    ? Math.max(1, Math.ceil((new Date(currentAd.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : 1;

  // Sample default video fallbacks if URL is invalid or empty
  const videoSrc = currentAd.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-farmer-hands-holding-fresh-tomatoes-42984-large.mp4";

  return (
    <section className="section container animate-slide-up" style={{ marginBottom: "2.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 12px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "bold" }}>
            📺 Featured Farmer Video Ads
          </span>
          <h2 style={{ fontSize: "1.6rem", marginTop: "0.3rem", marginBottom: "0.2rem" }}>
            Direct Farm Video Promotions ({currentIndex + 1} of {ads.length})
          </h2>
        </div>
        {ads.length > 1 && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-sm btn-outline" onClick={handlePrevAd}>
              ◀ Prev Ad
            </button>
            <button className="btn btn-sm btn-outline" onClick={handleNextAd}>
              Next Ad ▶
            </button>
          </div>
        )}
      </div>

      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          background: "#0f172a",
          color: "#fff",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))"
        }}
      >
        {/* Video Player */}
        <div style={{ position: "relative", minHeight: "320px", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {videoSrc.includes("youtube.com") || videoSrc.includes("youtu.be") ? (
            <iframe
              src={videoSrc.replace("watch?v=", "embed/") + "?autoplay=1&mute=1"}
              title={currentAd.title}
              style={{ width: "100%", height: "100%", border: "none", minHeight: "320px" }}
              allow="autoplay; encrypted-media"
            ></iframe>
          ) : (
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnded}
              style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: "320px", maxHeight: "400px" }}
            />
          )}

          {/* Badge Overlay */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(6px)",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
            🌾 {currentAd.farmerName || "Verified Farm Partner"}
          </div>

          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(6px)",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "0.78rem",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <FiClock color="#fbbf24" /> Active for {daysLeft} more {daysLeft === 1 ? "day" : "days"}
          </div>
        </div>

        {/* Product Details & Action Sidebar */}
        <div style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "between", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
          <div>
            <span style={{ color: "#38bdf8", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>
              📢 Featured Product Ad
            </span>
            <h3 style={{ fontSize: "1.6rem", color: "#fff", marginTop: "0.4rem", marginBottom: "0.6rem" }}>
              {currentAd.title || currentAd.product?.name || "Farm Harvest Promotion"}
            </h3>

            {currentAd.product && (
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "var(--radius-sm)",
                  padding: "1rem",
                  marginTop: "1rem",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem"
                }}
              >
                <img
                  src={currentAd.product.images?.[0]?.url || currentAd.product.image || "/images/aloo.png"}
                  alt={currentAd.product.name}
                  style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(255,255,255,0.2)" }}
                />
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: "1.1rem", display: "block", color: "#fff" }}>{currentAd.product.name}</strong>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <span style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#4ade80" }}>
                      ₹{currentAd.product.discountPrice || currentAd.product.price}
                    </span>
                    {currentAd.product.discountPrice && (
                      <span style={{ textDecoration: "line-through", opacity: 0.6, fontSize: "0.85rem" }}>
                        ₹{currentAd.product.price}
                      </span>
                    )}
                    <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>/ {currentAd.product.unit || "kg"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "1.8rem", flexWrap: "wrap" }}>
            <button
              className="btn"
              onClick={handleAddToCart}
              style={{
                background: "var(--primary)",
                color: "#fff",
                flex: 1,
                padding: "0.8rem 1.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: "bold",
                fontSize: "1rem"
              }}
            >
              <FiShoppingCart /> Add to Cart
            </button>
            <button
              className="btn"
              onClick={handleDirectOrder}
              style={{
                background: "#22c55e",
                color: "#fff",
                flex: 1,
                padding: "0.8rem 1.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: "bold",
                fontSize: "1rem"
              }}
            >
              ⚡ Order Now <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
