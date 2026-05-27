import { useEffect, useState } from "react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";

export default function Wishlist() {
  const [user, setUser] = useState(null);
  useEffect(() => { api.get("/auth/profile").then((r) => setUser(r.data)); }, []);
  if (!user) return <Loader />;
  if (!user.wishlist?.length) return <div className="container section text-center"><h2>Wishlist is empty</h2><p className="muted">Save your favourite produce here.</p></div>;
  return (
    <div className="container section">
      <h1 className="mb-2">My Wishlist</h1>
      <div className="grid grid-4">
        {user.wishlist.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </div>
  );
}
