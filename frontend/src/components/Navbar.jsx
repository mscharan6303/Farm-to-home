import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiShoppingCart, FiUser, FiMenu, FiX, FiBox, FiArrowLeft, FiMessageSquare } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { socket } from "../services/socket";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const location = useLocation();
  const count = cart?.items?.length || 0;
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const getLanguage = () => {
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    return match ? match[1] : 'en';
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    if (lang === "en") {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname + ";";
      window.location.reload();
    } else {
      document.cookie = `googtrans=/en/${lang}; path=/;`;
      document.cookie = `googtrans=/en/${lang}; path=/; domain=${window.location.hostname};`;
      window.location.reload();
    }
  };

  const LanguageSelector = () => (
    <select className="custom-lang-select desktop-translate" value={getLanguage()} onChange={handleLanguageChange} style={{ marginRight: '5px' }}>
      <option value="en">English (Original)</option>
      <option value="hi">Hindi</option>
      <option value="te">Telugu</option>
      <option value="ta">Tamil</option>
      <option value="bn">Bengali</option>
      <option value="mr">Marathi</option>
      <option value="gu">Gujarati</option>
      <option value="kn">Kannada</option>
      <option value="ml">Malayalam</option>
      <option value="pa">Punjabi</option>
      <option value="ur">Urdu</option>
    </select>
  );

  useEffect(() => {
    setOpen(false);
    if (location.pathname === "/chat") {
      setHasNewMessage(false);
    }
  }, [nav, location.pathname]);

  useEffect(() => {
    if (!user) {
      socket.disconnect();
      return;
    }
    
    if (!socket.connected) {
      socket.connect();
    }
    
    socket.emit("user:online", user._id);
    const handleNotif = () => {
      if (location.pathname !== "/chat") {
        setHasNewMessage(true);
      }
    };
    
    const handleOrderNotif = ({ orderId, status }) => {
      toast(`📦 Your order #${orderId.slice(-6)} is now ${status}!`, {
        duration: 5000,
        position: 'top-right',
        style: { background: 'var(--primary)', color: '#fff' }
      });
    };

    socket.on("chat:notification", handleNotif);
    socket.on("order:notification", handleOrderNotif);

    return () => {
      socket.off("chat:notification", handleNotif);
      socket.off("order:notification", handleOrderNotif);
    };
  }, [user, location.pathname]);

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {location.pathname !== "/" && location.pathname !== "/farmer" && (
            <button onClick={() => nav(-1)} className="icon-btn mobile-toggle" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiArrowLeft size={24} color="var(--primary)" />
            </button>
          )}
          <Link to={user?.role === "farmer" ? "/farmer" : "/"} className="logo">
            Farm to <span>Home</span>
          </Link>
        </div>

        <div className={`nav-links ${open ? "open" : ""}`}>
          {user?.role === "farmer" && <NavLink to="/farmer">Farmer Dashboard</NavLink>}
          {user?.role === "delivery" && <NavLink to="/delivery" style={{ color: "var(--primary)", fontWeight: "bold" }}>🛵 Delivery Hub</NavLink>}
          {user?.role === "admin" && (
            <>
              <NavLink to="/farmer">Farmer Panel</NavLink>
              <NavLink to="/delivery">Delivery Hub</NavLink>
              <NavLink to="/admin" style={{ color: "var(--primary)", fontWeight: "bold" }}>📊 Platform Admin</NavLink>
            </>
          )}
          
          {(!user || (user.role !== "farmer" && user.role !== "delivery" && user.role !== "admin")) && (
            <>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/products">Products</NavLink>
              <NavLink to="/about">About Us</NavLink>
              {user && (
                <>
                  <NavLink to="/orders">My Orders</NavLink>
                  <NavLink to="/subscriptions" style={{ color: "var(--primary)", fontWeight: "bold" }}>🌟 Subscriptions</NavLink>
                </>
              )}
            </>
          )}

          <div className="nav-actions">
            {(!user || (user.role !== "farmer" && user.role !== "delivery")) && (
              <Link to="/cart" className="icon-btn">
                <FiShoppingCart />
                {count > 0 && <span className="count">{count}</span>}
              </Link>
            )}
            
            {user ? (
              <div className="flex gap-2 center">
                <div id="google_translate_element"></div>
                <LanguageSelector />
                {user.role !== "farmer" && <Link to="/profile" className="icon-btn" title="Profile"><FiUser /></Link>}
                {user.role !== "delivery" && (
                  <Link to="/chat" className="icon-btn" title="Messages" style={{ position: "relative" }}>
                    <FiMessageSquare />
                    {hasNewMessage && <span style={{ position: "absolute", top: "5px", right: "5px", width: "10px", height: "10px", backgroundColor: "var(--danger)", borderRadius: "50%" }}></span>}
                  </Link>
                )}
                <button className="btn btn-sm btn-outline" onClick={() => { logout(); nav("/"); }}>Logout</button>
              </div>
            ) : (
              <>
                <div id="google_translate_element"></div>
                <LanguageSelector />
                <Link to="/login" className="btn btn-sm btn-outline">Login</Link>
                <Link to="/register" className="btn btn-sm" style={{ color: "#fff" }}>Sign up</Link>
              </>
            )}
          </div>
        </div>

        <button className="mobile-toggle" onClick={() => setOpen(!open)}>
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>
    </nav>
  );
}
