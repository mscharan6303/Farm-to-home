import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import OrderDetails from "./pages/OrderDetails";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import AddProduct from "./pages/farmer/AddProduct";
import EditProduct from "./pages/farmer/EditProduct";
import ManageProducts from "./pages/farmer/ManageProducts";
import OrdersReceived from "./pages/farmer/OrdersReceived";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import OrderMonitoring from "./pages/admin/OrderMonitoring";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: "70vh" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

          <Route path="/farmer" element={<ProtectedRoute roles={["farmer","admin"]}><FarmerDashboard /></ProtectedRoute>} />
          <Route path="/farmer/products" element={<ProtectedRoute roles={["farmer","admin"]}><ManageProducts /></ProtectedRoute>} />
          <Route path="/farmer/products/new" element={<ProtectedRoute roles={["farmer","admin"]}><AddProduct /></ProtectedRoute>} />
          <Route path="/farmer/products/:id/edit" element={<ProtectedRoute roles={["farmer","admin"]}><EditProduct /></ProtectedRoute>} />
          <Route path="/farmer/orders" element={<ProtectedRoute roles={["farmer","admin"]}><OrdersReceived /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute roles={["admin"]}><OrderMonitoring /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
