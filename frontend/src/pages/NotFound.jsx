import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="container section text-center" style={{ padding: "5rem 1rem" }}>
      <h1 style={{ fontSize: "5rem" }}>404</h1>
      <p className="muted mb-2">This page seems to have wandered off the farm.</p>
      <Link to="/" className="btn">Back home</Link>
    </div>
  );
}
