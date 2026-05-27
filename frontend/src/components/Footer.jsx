import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>🌾 Farm to Home</h4>
            <p style={{ color: "#a89f8c", fontSize: ".9rem" }}>
              Fresh produce delivered straight from Indian farmers to your kitchen — no middlemen, fair prices.
            </p>
          </div>
          <div>
            <h4>Shop</h4>
            <Link to="/products">All Products</Link>
            <Link to="/products?category=Vegetables">Vegetables</Link>
            <Link to="/products?category=Fruits">Fruits</Link>
            <Link to="/products?organic=true">Organic</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/register">Become a Farmer</Link>
          </div>
          <div>
            <h4>Contact</h4>
            <p style={{ color: "#a89f8c", fontSize: ".9rem" }}>
              hello@farmtohome.in<br />+91 98765 43210
            </p>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} Farm to Home. Made with 💚 in India.</div>
      </div>
    </footer>
  );
}
