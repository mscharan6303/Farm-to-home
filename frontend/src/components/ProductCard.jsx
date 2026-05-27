import { Link } from "react-router-dom";
import { FiStar } from "react-icons/fi";

export default function ProductCard({ product }) {
  const img = product.images?.[0]?.url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
  const price = product.discountPrice > 0 ? product.discountPrice : product.price;
  return (
    <Link to={`/products/${product._id}`} className="card product-card">
      <div className="img">
        <img src={img} alt={product.name} />
        <div className="badges">
          {product.organic && <span className="badge badge-organic">Organic</span>}
          {product.discountPrice > 0 && <span className="badge badge-discount">Sale</span>}
        </div>
      </div>
      <div className="body">
        <h4>{product.name}</h4>
        <div className="farmer">by {product.farmer?.farmName || product.farmer?.name || "Local Farmer"}</div>
        <div className="flex between center">
          <div className="price">
            <span className="price-main">₹{price}/{product.unit || "kg"}</span>
            {product.discountPrice > 0 && <span className="price-old">₹{product.price}</span>}
          </div>
          {product.rating > 0 && (
            <span className="rating"><FiStar /> {product.rating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
