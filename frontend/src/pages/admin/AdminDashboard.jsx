import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getEffectiveProducts } from "../../services/api";
import { getAllSyncedOrders, subscribeToSyncEvents, notifySyncListeners } from "../../services/cloudSync";
import toast from "react-hot-toast";
import {
  FiDollarSign,
  FiTrendingUp,
  FiShoppingBag,
  FiUsers,
  FiPieChart,
  FiRefreshCw,
  FiTruck,
  FiTrash2,
  FiEdit,
  FiPlus,
  FiX,
  FiShield,
  FiCheckCircle,
  FiLock,
  FiUnlock,
  FiPackage,
  FiSliders
} from "react-icons/fi";

const DEFAULT_USERS = [
  { id: "u1", name: "System Admin", email: "admin@demo.com", role: "admin", status: "Active", createdAt: "2026-01-01" },
  { id: "u2", name: "Green Acres Demo Farmer", email: "farmer@demo.com", role: "farmer", status: "Active", createdAt: "2026-01-05" },
  { id: "u3", name: "Anil Kumar (Delivery Partner)", email: "delivery@demo.com", role: "delivery", status: "Active", createdAt: "2026-01-10" },
  { id: "u4", name: "Priya Sharma (Customer)", email: "customer@demo.com", role: "customer", status: "Active", createdAt: "2026-01-15" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("financials"); // "financials" | "products" | "orders" | "users"
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Adding/Editing Products
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "Vegetables",
    price: "",
    discountPrice: "",
    stock: "50",
    unit: "kg",
    imageUrl: "/images/aloo.png",
    description: "",
    farmerEmail: "farmer@demo.com",
    organic: true,
  });

  // Modal State for Adding User
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "customer",
    status: "Active",
  });

  // Load All Master Data
  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      // Load Orders
      const allSynced = await getAllSyncedOrders();
      let apiOrders = [];
      try {
        const res = await api.get("/orders");
        if (Array.isArray(res.data)) apiOrders = res.data;
      } catch (e) {}

      const map = new Map();
      allSynced.forEach((o) => o && o._id && map.set(o._id, o));
      apiOrders.forEach((o) => o && o._id && map.set(o._id, { ...map.get(o._id), ...o }));

      // Deleted Orders Override
      let deletedOrders = [];
      let statusOverrides = {};
      let paymentOverrides = {};
      try {
        deletedOrders = JSON.parse(localStorage.getItem("admin_deleted_orders") || "[]");
        statusOverrides = JSON.parse(localStorage.getItem("farmer_order_status_overrides") || "{}");
        paymentOverrides = JSON.parse(localStorage.getItem("farmer_order_payment_overrides") || "{}");
      } catch (e) {}

      const deletedSet = new Set(deletedOrders);

      const orderList = Array.from(map.values())
        .filter((o) => o && o._id && !deletedSet.has(o._id) && o._id !== "ORD-1790402239214")
        .map((o) => {
          const copy = { ...o };
          if (statusOverrides[copy._id]) copy.status = statusOverrides[copy._id];
          if (paymentOverrides[copy._id] !== undefined) copy.isPaid = paymentOverrides[copy._id];
          return copy;
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setOrders(orderList);

      // Load Products
      const currentProducts = getEffectiveProducts();
      setProducts(currentProducts);

      // Load Users
      let customUsers = [];
      try {
        customUsers = JSON.parse(localStorage.getItem("admin_custom_users") || "[]");
      } catch (e) {}
      setUsers([...DEFAULT_USERS, ...customUsers]);

    } catch (err) {
      console.warn("Failed to load admin dashboard data:", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const unsubscribe = subscribeToSyncEvents(() => loadData(false));
    const timer = setInterval(() => loadData(false), 5000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  // --- PRODUCT MASTER CONTROL HANDLERS ---
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      category: "Vegetables",
      price: "",
      discountPrice: "",
      stock: "50",
      unit: "kg",
      imageUrl: "/images/aloo.png",
      description: "",
      farmerEmail: "farmer@demo.com",
      organic: true,
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || "",
      category: prod.category || "Vegetables",
      price: prod.price || "",
      discountPrice: prod.discountPrice || "",
      stock: prod.stock || 50,
      unit: prod.unit || "kg",
      imageUrl: prod.images?.[0]?.url || prod.image || "/images/aloo.png",
      description: prod.description || "",
      farmerEmail: prod.farmer?.email || "farmer@demo.com",
      organic: prod.organic !== undefined ? prod.organic : true,
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      toast.error("Please fill in product name and price");
      return;
    }

    try {
      if (editingProduct) {
        // Edit existing product
        const id = editingProduct._id || editingProduct.id;
        let editedMap = {};
        try {
          editedMap = JSON.parse(localStorage.getItem("admin_edited_products") || "{}");
        } catch (err) {}

        editedMap[id] = {
          name: productForm.name,
          category: productForm.category,
          price: Number(productForm.price),
          discountPrice: Number(productForm.discountPrice || productForm.price),
          stock: Number(productForm.stock),
          unit: productForm.unit,
          images: [{ url: productForm.imageUrl, publicId: `img_${Date.now()}` }],
          description: productForm.description,
          organic: productForm.organic,
          farmer: {
            _id: "farmer_demo_1",
            name: "Demo Farmer",
            email: productForm.farmerEmail,
            farmName: "Green Acres Demo Farm"
          }
        };

        localStorage.setItem("admin_edited_products", JSON.stringify(editedMap));
        toast.success("Product updated successfully! ✏️");
      } else {
        // Add new product
        let customList = [];
        try {
          customList = JSON.parse(localStorage.getItem("admin_custom_products") || "[]");
        } catch (err) {}

        const newProd = {
          _id: `prod_custom_${Date.now()}`,
          name: productForm.name,
          category: productForm.category,
          description: productForm.description || "Freshly harvested produce from local farm.",
          price: Number(productForm.price),
          discountPrice: Number(productForm.discountPrice || productForm.price),
          stock: Number(productForm.stock || 50),
          unit: productForm.unit || "kg",
          images: [{ url: productForm.imageUrl || "/images/aloo.png", publicId: `img_${Date.now()}` }],
          organic: productForm.organic,
          seasonal: true,
          farmer: {
            _id: "farmer_demo_1",
            name: "Demo Farmer",
            email: productForm.farmerEmail || "farmer@demo.com",
            farmName: "Green Acres Demo Farm"
          },
          rating: 4.8,
          numReviews: 12,
          sold: 0,
          createdAt: new Date().toISOString()
        };

        customList.unshift(newProd);
        localStorage.setItem("admin_custom_products", JSON.stringify(customList));
        toast.success("New product added to platform! 🥦");
      }

      setShowProductModal(false);
      loadData(false);
      notifySyncListeners();
    } catch (err) {
      toast.error("Failed to save product details");
    }
  };

  const handleDeleteProduct = (prodId) => {
    if (!confirm("Are you sure you want to delete this product from the platform catalog?")) return;

    try {
      let deletedList = [];
      try {
        deletedList = JSON.parse(localStorage.getItem("admin_deleted_products") || "[]");
      } catch (e) {}

      if (!deletedList.includes(prodId)) {
        deletedList.push(prodId);
        localStorage.setItem("admin_deleted_products", JSON.stringify(deletedList));
      }

      toast.success("Product removed from platform catalog 🗑️");
      loadData(false);
      notifySyncListeners();
    } catch (e) {
      toast.error("Failed to delete product");
    }
  };

  // --- ORDER MASTER CONTROL HANDLERS ---
  const handleDeleteOrder = (orderId) => {
    if (!confirm(`Are you sure you want to permanently delete order ${orderId.slice(-6).toUpperCase()}?`)) return;

    try {
      let deletedOrders = [];
      try {
        deletedOrders = JSON.parse(localStorage.getItem("admin_deleted_orders") || "[]");
      } catch (e) {}

      if (!deletedOrders.includes(orderId)) {
        deletedOrders.push(orderId);
        localStorage.setItem("admin_deleted_orders", JSON.stringify(deletedOrders));
      }

      toast.success("Order deleted successfully");
      loadData(false);
      notifySyncListeners();
    } catch (e) {
      toast.error("Failed to delete order");
    }
  };

  const handleOverrideStatus = (orderId, newStatus) => {
    try {
      let statusOverrides = {};
      try {
        statusOverrides = JSON.parse(localStorage.getItem("farmer_order_status_overrides") || "{}");
      } catch (e) {}

      statusOverrides[orderId] = newStatus;
      localStorage.setItem("farmer_order_status_overrides", JSON.stringify(statusOverrides));
      toast.success(`Order status overridden to "${newStatus}"`);
      loadData(false);
      notifySyncListeners();
    } catch (e) {
      toast.error("Failed to override status");
    }
  };

  const handleTogglePayment = (orderId, currentPaid) => {
    try {
      let paymentOverrides = {};
      try {
        paymentOverrides = JSON.parse(localStorage.getItem("farmer_order_payment_overrides") || "{}");
      } catch (e) {}

      paymentOverrides[orderId] = !currentPaid;
      localStorage.setItem("farmer_order_payment_overrides", JSON.stringify(paymentOverrides));
      toast.success(`Payment status updated to ${!currentPaid ? "PAID ✅" : "UNPAID ⏳"}`);
      loadData(false);
      notifySyncListeners();
    } catch (e) {
      toast.error("Failed to update payment status");
    }
  };

  const handleResetOverrides = () => {
    if (!confirm("Reset all manual order overrides and restored deleted orders?")) return;
    localStorage.removeItem("farmer_order_status_overrides");
    localStorage.removeItem("farmer_order_payment_overrides");
    localStorage.removeItem("admin_deleted_orders");
    toast.success("All order overrides reset!");
    loadData(false);
    notifySyncListeners();
  };

  // --- USER MASTER CONTROL HANDLERS ---
  const handleAddUser = (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) {
      toast.error("Please provide name and email");
      return;
    }

    try {
      let customUsers = [];
      try {
        customUsers = JSON.parse(localStorage.getItem("admin_custom_users") || "[]");
      } catch (e) {}

      const newUser = {
        id: `u_${Date.now()}`,
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        status: userForm.status,
        createdAt: new Date().toISOString().split("T")[0]
      };

      customUsers.unshift(newUser);
      localStorage.setItem("admin_custom_users", JSON.stringify(customUsers));
      toast.success("New user account created successfully! 👤");
      setShowUserModal(false);
      loadData(false);
    } catch (e) {
      toast.error("Failed to create user account");
    }
  };

  const handleToggleUserStatus = (userId) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === "Active" ? "Suspended" : "Active";
          toast.success(`User ${u.email} account is now ${nextStatus}`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleDeleteUser = (userId, email) => {
    if (!confirm(`Delete user account ${email}?`)) return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success("User account removed");
  };

  // Platform Monetization Calculations
  const grossGMV = orders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
  const platformCommissionRate = 0.10; // 10% Platform Fee
  const platformCommissionEarned = grossGMV * platformCommissionRate;
  const netFarmerPayouts = grossGMV * (1 - platformCommissionRate);
  const totalDeliveryFees = orders.reduce((sum, o) => sum + Number(o.deliveryCharge || (o.totalPrice > 0 ? 30 : 0)), 0);
  const totalPlatformNetProfit = platformCommissionEarned + totalDeliveryFees;

  // Aggregated Per-Farmer Payout Classification
  const farmerPayoutsMap = new Map();
  orders.forEach((o) => {
    const total = Number(o.totalPrice || 0);
    const itemsCount = o.items?.length || 1;
    const farmerName = "Demo Organic Farmer";
    const farmerEmail = "farmer@demo.com";
    const farmerId = "farmer_demo_1";

    if (!farmerPayoutsMap.has(farmerId)) {
      farmerPayoutsMap.set(farmerId, {
        id: farmerId,
        name: farmerName,
        email: farmerEmail,
        ordersCount: 0,
        itemsCount: 0,
        grossSales: 0,
        commissionDeducted: 0,
        netPayoutDue: 0
      });
    }

    const f = farmerPayoutsMap.get(farmerId);
    f.ordersCount += 1;
    f.itemsCount += itemsCount;
    f.grossSales += total;
    f.commissionDeducted += total * 0.10;
    f.netPayoutDue += total * 0.90;
  });
  const farmerPayoutList = Array.from(farmerPayoutsMap.values());

  return (
    <div className="container animate-slide-up" style={{ padding: "2.5rem 1.5rem", minHeight: "85vh" }}>
      {/* Admin Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "var(--radius-md)",
          padding: "2rem",
          color: "#fff",
          marginBottom: "2rem",
          boxShadow: "0 10px 25px rgba(15,23,42,0.3)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600" }}>
              👑 Master Platform Admin Control Center
            </span>
            <h1 style={{ fontSize: "2.2rem", marginTop: "0.5rem", marginBottom: "0.3rem", color: "#fff" }}>
              Farm to Home Platform Management
            </h1>
            <p style={{ opacity: 0.85, margin: 0, fontSize: "0.95rem" }}>
              Logged in as: <strong>admin@demo.com</strong> (Full Master Control Active)
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              className="btn btn-sm"
              onClick={() => loadData(true)}
              style={{ background: "var(--primary)", color: "#fff", padding: "0.6rem 1.2rem", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FiRefreshCw /> Refresh Sync
            </button>
            <button
              className="btn btn-sm"
              onClick={handleOpenAddProduct}
              style={{ background: "#22c55e", color: "#fff", padding: "0.6rem 1.2rem", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FiPlus /> Add New Product
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div style={{ display: "flex", gap: "12px", marginTop: "2rem", overflowX: "auto", borderBottom: "1px solid rgba(255,255,255,0.15)", pb: "8px" }}>
          <button
            onClick={() => setActiveTab("financials")}
            style={{
              background: activeTab === "financials" ? "var(--primary)" : "transparent",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "var(--radius-sm)",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <FiPieChart /> Financials & Payouts
          </button>

          <button
            onClick={() => setActiveTab("products")}
            style={{
              background: activeTab === "products" ? "var(--primary)" : "transparent",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "var(--radius-sm)",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <FiPackage /> Product Catalog ({products.length})
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            style={{
              background: activeTab === "orders" ? "var(--primary)" : "transparent",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "var(--radius-sm)",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <FiTruck /> Orders Control ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab("users")}
            style={{
              background: activeTab === "users" ? "var(--primary)" : "transparent",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "var(--radius-sm)",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <FiUsers /> Users & Accounts ({users.length})
          </button>
        </div>
      </div>

      {/* --- TAB 1: FINANCIALS & PAYOUTS --- */}
      {activeTab === "financials" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.2rem", marginBottom: "2rem" }}>
            <div className="card" style={{ padding: "1.2rem", borderLeft: "4px solid #38bdf8" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block" }}>Gross Platform Sales (GMV)</span>
              <strong style={{ fontSize: "1.8rem", color: "var(--text)" }}>₹{grossGMV.toFixed(2)}</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginTop: "4px" }}>Across {orders.length} total orders</span>
            </div>

            <div className="card" style={{ padding: "1.2rem", borderLeft: "4px solid #16a34a" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block" }}>10% Platform Commission</span>
              <strong style={{ fontSize: "1.8rem", color: "#16a34a" }}>₹{platformCommissionEarned.toFixed(2)}</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginTop: "4px" }}>Direct Platform Fee (10%)</span>
            </div>

            <div className="card" style={{ padding: "1.2rem", borderLeft: "4px solid #d97706" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block" }}>Net Farmer Payouts (90%)</span>
              <strong style={{ fontSize: "1.8rem", color: "#d97706" }}>₹{netFarmerPayouts.toFixed(2)}</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginTop: "4px" }}>Transferred to registered farmers</span>
            </div>

            <div className="card" style={{ padding: "1.2rem", borderLeft: "4px solid #059669" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block" }}>Total Platform Net Profit</span>
              <strong style={{ fontSize: "1.8rem", color: "#059669" }}>₹{totalPlatformNetProfit.toFixed(2)}</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginTop: "4px" }}>Commission + Delivery Fees</span>
            </div>
          </div>

          <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <FiUsers color="var(--primary)" /> Farmer Payout Classification (Money to be Paid Per Farmer)
          </h2>

          {farmerPayoutList.length > 0 && (
            <div className="table-responsive" style={{ background: "#fff", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflow: "hidden", marginBottom: "3rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "1rem" }}>Farmer Account</th>
                    <th style={{ padding: "1rem" }}>Total Orders</th>
                    <th style={{ padding: "1rem" }}>Gross Produce Sales</th>
                    <th style={{ padding: "1rem" }}>10% Commission Deducted</th>
                    <th style={{ padding: "1rem" }}>Net Amount To Be Paid (90%)</th>
                    <th style={{ padding: "1rem" }}>Payout Status</th>
                  </tr>
                </thead>
                <tbody>
                  {farmerPayoutList.map((f) => (
                    <tr key={f.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: "bold", color: "var(--text)" }}>🌾 {f.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{f.email}</div>
                      </td>
                      <td style={{ padding: "1rem", fontWeight: "600" }}>
                        {f.ordersCount} Orders ({f.itemsCount} items)
                      </td>
                      <td style={{ padding: "1rem", fontWeight: "bold", color: "var(--text)" }}>
                        ₹{f.grossSales.toFixed(2)}
                      </td>
                      <td style={{ padding: "1rem", fontWeight: "bold", color: "#dc2626" }}>
                        -₹{f.commissionDeducted.toFixed(2)}
                      </td>
                      <td style={{ padding: "1rem", fontWeight: "bold", fontSize: "1.1rem", color: "#16a34a" }}>
                        ₹{f.netPayoutDue.toFixed(2)}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span className="badge badge-organic" style={{ fontSize: "0.82rem", padding: "4px 10px" }}>
                          Ready for Bank Payout ✅
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: PRODUCTS CATALOG MASTER CONTROL --- */}
      {activeTab === "products" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <FiPackage color="var(--primary)" /> Products Catalog Control
              </h2>
              <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>
                Add, Edit, or Delete any product in the store catalog. Changes instantly sync across all dashboards.
              </p>
            </div>
            <button
              className="btn"
              onClick={handleOpenAddProduct}
              style={{ background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FiPlus /> Add New Product
            </button>
          </div>

          <div className="table-responsive" style={{ background: "#fff", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: "1rem" }}>Product</th>
                  <th style={{ padding: "1rem" }}>Category</th>
                  <th style={{ padding: "1rem" }}>Price</th>
                  <th style={{ padding: "1rem" }}>Stock</th>
                  <th style={{ padding: "1rem" }}>Farmer / Owner</th>
                  <th style={{ padding: "1rem" }}>Organic</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Master Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const id = p._id || p.id;
                  const imgUrl = p.images?.[0]?.url || p.image || "/images/aloo.png";
                  return (
                    <tr key={id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "12px" }}>
                        <img src={imgUrl} alt={p.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
                        <div>
                          <div style={{ fontWeight: "bold", color: "var(--text)" }}>{p.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>ID: #{id.slice(-6)}</div>
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span className="badge" style={{ background: "#f1f5f9", color: "#334155" }}>
                          {p.category}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", fontWeight: "bold" }}>
                        ₹{p.discountPrice || p.price} <span style={{ textDecoration: "line-through", opacity: 0.5, fontSize: "0.8rem" }}>₹{p.price}</span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span className={`badge ${p.stock > 10 ? "badge-organic" : "badge-danger"}`}>
                          {p.stock || 50} {p.unit || "kg"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.85rem" }}>
                        <div>{p.farmer?.name || "Demo Farmer"}</div>
                        <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{p.farmer?.email || "farmer@demo.com"}</div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {p.organic ? <span className="badge badge-organic">Organic 🌱</span> : <span className="badge">Standard</span>}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleOpenEditProduct(p)}
                            style={{ display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <FiEdit /> Edit
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleDeleteProduct(id)}
                            style={{ background: "#ef4444", color: "#fff", border: "none", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: ORDERS MASTER CONTROL --- */}
      {activeTab === "orders" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <FiTruck color="var(--primary)" /> Orders Master Control & Override
              </h2>
              <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>
                Modify order fulfillment statuses, payment statuses, or delete orders with master admin rights.
              </p>
            </div>
            <button className="btn btn-sm btn-outline" onClick={handleResetOverrides}>
              Reset Manual Overrides
            </button>
          </div>

          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="card text-center" style={{ padding: "3rem", borderStyle: "dashed" }}>
              <h3>No orders in system</h3>
            </div>
          ) : (
            <div className="table-responsive" style={{ background: "#fff", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "1rem" }}>Order ID</th>
                    <th style={{ padding: "1rem" }}>Customer</th>
                    <th style={{ padding: "1rem" }}>Date</th>
                    <th style={{ padding: "1rem" }}>Total Amount</th>
                    <th style={{ padding: "1rem" }}>Payment Mode</th>
                    <th style={{ padding: "1rem" }}>Order Status Override</th>
                    <th style={{ padding: "1rem", textAlign: "right" }}>Master Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const total = Number(o.totalPrice || 0);
                    return (
                      <tr key={o._id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "1rem" }}>
                          <Link to={`/orders/${o._id}`} style={{ fontWeight: "bold", color: "var(--primary)" }}>
                            #{o._id.slice(-6).toUpperCase()}
                          </Link>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: "600" }}>{o.user?.name || "Customer"}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{o.user?.email || "customer@demo.com"}</div>
                        </td>
                        <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                          {new Date(o.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td style={{ padding: "1rem", fontWeight: "bold" }}>
                          ₹{total.toFixed(2)}
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <button
                            className={`badge ${o.isPaid ? "badge-organic" : "badge-danger"}`}
                            onClick={() => handleTogglePayment(o._id, o.isPaid)}
                            style={{ border: "none", cursor: "pointer" }}
                            title="Click to toggle payment status"
                          >
                            {o.isPaid ? "Paid ✅" : "COD Pending ⏳ (Click to mark Paid)"}
                          </button>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <select
                            value={o.status || "Processing"}
                            onChange={(e) => handleOverrideStatus(o._id, e.target.value)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border)",
                              fontWeight: "600",
                              background: o.status === "Delivered" ? "#dcfce7" : o.status === "Cancelled" ? "#fee2e2" : "#fef3c7"
                            }}
                          >
                            <option value="Processing">Processing ⏳</option>
                            <option value="Confirmed">Confirmed ✅</option>
                            <option value="In Transit">In Transit 🛵</option>
                            <option value="Delivered">Delivered 🎉</option>
                            <option value="Cancelled">Cancelled ❌</option>
                          </select>
                        </td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleDeleteOrder(o._id)}
                            style={{ background: "#ef4444", color: "#fff", border: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: USERS & ACCOUNTS DIRECTORY --- */}
      {activeTab === "users" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <FiUsers color="var(--primary)" /> User & Account Directory
              </h2>
              <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>
                Manage all registered Customer, Farmer, Delivery Agent, and Admin user accounts.
              </p>
            </div>
            <button
              className="btn"
              onClick={() => setShowUserModal(true)}
              style={{ background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FiPlus /> Add New Account
            </button>
          </div>

          <div className="table-responsive" style={{ background: "#fff", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: "1rem" }}>User Account</th>
                  <th style={{ padding: "1rem" }}>Role</th>
                  <th style={{ padding: "1rem" }}>Status</th>
                  <th style={{ padding: "1rem" }}>Created Date</th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>Master Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: "bold", color: "var(--text)" }}>{u.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        className="badge"
                        style={{
                          background: u.role === "admin" ? "#0f172a" : u.role === "farmer" ? "#16a34a" : u.role === "delivery" ? "#0284c7" : "#64748b",
                          color: "#fff",
                          textTransform: "uppercase",
                          fontSize: "0.75rem"
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className={`badge ${u.status === "Active" ? "badge-organic" : "badge-danger"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                      {u.createdAt}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleToggleUserStatus(u.id)}
                          style={{ display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          {u.status === "Active" ? <FiLock /> : <FiUnlock />}
                          {u.status === "Active" ? "Suspend" : "Activate"}
                        </button>
                        {u.role !== "admin" && (
                          <button
                            className="btn btn-sm"
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            style={{ background: "#ef4444", color: "#fff", border: "none", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <FiTrash2 /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT PRODUCT MODAL --- */}
      {showProductModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="animate-scale-up" style={{ background: "#fff", width: "100%", maxWidth: "550px", borderRadius: "var(--radius-md)", padding: "2rem", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0 }}>{editingProduct ? "✏️ Edit Product Details" : "🥦 Add New Product to Catalog"}</h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Product Name *</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: "100%" }}
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Fresh Organic Tomatoes"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Category</label>
                  <select
                    className="input"
                    style={{ width: "100%" }}
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Leafy Vegetables">Leafy Vegetables</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Grains">Grains</option>
                    <option value="Organic Products">Organic Products</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Unit</label>
                  <input
                    type="text"
                    className="input"
                    style={{ width: "100%" }}
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    placeholder="kg / bunch / liter"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>MRP Price (₹) *</label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: "100%" }}
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="40"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Discount Price (₹)</label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: "100%" }}
                    value={productForm.discountPrice}
                    onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })}
                    placeholder="35"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Stock</label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: "100%" }}
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Image URL</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: "100%" }}
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="/images/aloo.png"
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Farmer Email Owner</label>
                <input
                  type="email"
                  className="input"
                  style={{ width: "100%" }}
                  value={productForm.farmerEmail}
                  onChange={(e) => setProductForm({ ...productForm, farmerEmail: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Description</label>
                <textarea
                  className="input"
                  rows={3}
                  style={{ width: "100%" }}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Freshly farm harvested product details..."
                ></textarea>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                <button type="submit" className="btn" style={{ background: "var(--primary)", color: "#fff", flex: 1 }}>
                  {editingProduct ? "Save Changes" : "Add Product"}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowProductModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD USER MODAL --- */}
      {showUserModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="animate-scale-up" style={{ background: "#fff", width: "100%", maxWidth: "450px", borderRadius: "var(--radius-md)", padding: "2rem", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0 }}>👤 Register New System Account</h3>
              <button onClick={() => setShowUserModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Full Name *</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: "100%" }}
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Email Address *</label>
                <input
                  type="email"
                  className="input"
                  style={{ width: "100%" }}
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@demo.com"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.85rem", marginBottom: "4px" }}>Role</label>
                <select
                  className="input"
                  style={{ width: "100%" }}
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="customer">Customer</option>
                  <option value="farmer">Farmer</option>
                  <option value="delivery">Delivery Agent</option>
                  <option value="admin">Platform Admin</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                <button type="submit" className="btn" style={{ background: "var(--primary)", color: "#fff", flex: 1 }}>
                  Create Account
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowUserModal(false)}>
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
