import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiShoppingCart, FiHeart, FiUser, FiMenu, FiMessageCircle, FiBox } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { socket } from "../services/socket";
import { useLocation } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const nav = useNavigate();
  const location = useLocation();
  const count = cart.items?.length || 0;

  useEffect(() => {
    if (!user) return;
    socket.connect();
    socket.emit("user:online", user._id);
    
    const onNotif = () => setUnread(true);
    socket.on("chat:notification", onNotif);
    
    return () => {
      socket.off("chat:notification", onNotif);
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (location.pathname === "/chat") setUnread(false);
  }, [location.pathname]);

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to={user?.role === "farmer" ? "/farmer" : "/"} className="logo">🌾 Farm to Home</Link>

        <nav className={`nav-links ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
          {user?.role !== "farmer" && (
            <>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/products">Products</NavLink>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/contact">Contact</NavLink>
            </>
          )}
          {user?.role === "farmer" && <NavLink to="/farmer">Farmer Dashboard</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <div className="nav-actions">
          {user && user.role !== "farmer" && (
            <>
              <Link to="/chat" className="icon-btn" title="Chat">
                <FiMessageCircle />
                {unread && <span className="count">!</span>}
              </Link>
              <Link to="/orders" className="icon-btn" title="My Orders"><FiBox /></Link>
              <Link to="/wishlist" className="icon-btn" title="Wishlist"><FiHeart /></Link>
              <Link to="/cart" className="icon-btn" title="Cart">
                <FiShoppingCart />
                {count > 0 && <span className="count">{count}</span>}
              </Link>
            </>
          )}
          {user && user.role === "farmer" && (
            <>
              <Link to="/chat" className="icon-btn" title="Chat">
                <FiMessageCircle />
                {unread && <span className="count">!</span>}
              </Link>
            </>
          )}
          {user ? (
            <div className="flex gap-1 center">
              <div id="google_translate_element" style={{ display: 'inline-block', marginRight: '10px', marginTop: '4px' }}></div>
              {user.role !== "farmer" && <Link to="/profile" className="icon-btn"><FiUser /></Link>}
              <button className="btn btn-sm btn-outline" onClick={() => { logout(); nav("/"); }}>Logout</button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-outline">Login</Link>
              <Link to="/register" className="btn btn-sm">Sign up</Link>
            </>
          )}
          <button className="mobile-toggle" onClick={() => setOpen(!open)}><FiMenu /></button>
        </div>
      </div>
    </header>
  );
}
