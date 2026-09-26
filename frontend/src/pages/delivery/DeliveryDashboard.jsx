import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { getAllSyncedOrders, syncStatus, syncPayment, syncAgent, subscribeToSyncEvents, notifySyncListeners } from "../../services/cloudSync";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { FiTruck, FiMapPin, FiPhone, FiCheckCircle, FiClock, FiDollarSign, FiRefreshCw, FiLock, FiUserCheck } from "react-icons/fi";

const DELIVERY_STATUSES = ["Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const allSynced = await getAllSyncedOrders();
      let apiOrders = [];
      try {
        const res = await api.get("/orders/farmer/received");
        if (Array.isArray(res.data)) apiOrders = res.data;
      } catch (e) {}

      const map = new Map();
      allSynced.forEach((o) => o && o._id && map.set(o._id, o));
      apiOrders.forEach((o) => o && o._id && map.set(o._id, { ...map.get(o._id), ...o }));

      // Status, Payment & Agent overrides
      let statusOverrides = {};
      let paymentOverrides = {};
      let agentOverrides = {};
      try {
        statusOverrides = JSON.parse(localStorage.getItem("farmer_order_status_overrides") || "{}");
        paymentOverrides = JSON.parse(localStorage.getItem("farmer_order_payment_overrides") || "{}");
        agentOverrides = JSON.parse(localStorage.getItem("farmer_order_agent_overrides") || "{}");
      } catch (e) {}

      const list = Array.from(map.values())
        .filter((o) => o._id !== "ORD-1790402239214")
        .map((o) => {
          const copy = { ...o };
          if (statusOverrides[copy._id]) copy.status = statusOverrides[copy._id];
          if (paymentOverrides[copy._id] !== undefined) copy.isPaid = paymentOverrides[copy._id];
          if (agentOverrides[copy._id]) copy.deliveryAgent = agentOverrides[copy._id];
          return copy;
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setOrders(list);
    } catch (err) {
      console.warn("Failed to load delivery orders:", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const unsubscribe = subscribeToSyncEvents(() => load(false));
    const timer = setInterval(() => load(false), 3000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const acceptOrder = async (id, accept) => {
    const currentAgent = {
      id: user?._id || user?.email || "delivery_demo",
      name: user?.name || "Demo Delivery Driver",
      phone: user?.phone || "+91 9876543210"
    };
    const agentPayload = accept ? currentAgent : null;

    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, deliveryAgent: agentPayload, status: accept ? "Shipped" : o.status } : o))
    );

    await syncAgent(id, agentPayload);
    if (accept) {
      await syncStatus(id, "Shipped");
      toast.success(`Order #${id.slice(-6).toUpperCase()} accepted & locked to you! 🛵`);
    } else {
      toast.success(`Order #${id.slice(-6).toUpperCase()} unassigned`);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o)));
    await syncStatus(id, newStatus);
    try {
      await api.put(`/orders/status/${id}`, { status: newStatus });
    } catch (e) {}

    if (newStatus === "Delivered") {
      toast.success(`Order #${id.slice(-6).toUpperCase()} delivered successfully! 🎉`);
    } else if (newStatus === "Out for Delivery") {
      toast.success(`Order #${id.slice(-6).toUpperCase()} marked as Out for Delivery 🛵`);
    } else {
      toast.success(`Order status updated to "${newStatus}"`);
    }
  };

  const togglePayment = async (id, isPaid) => {
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, isPaid } : o)));
    await syncPayment(id, isPaid);
    try {
      await api.put(`/orders/pay/${id}`, { isPaid });
    } catch (e) {}

    if (isPaid) {
      toast.success(`COD Cash collected for Order #${id.slice(-6).toUpperCase()} ✅`);
    } else {
      toast.success(`Payment marked as pending for Order #${id.slice(-6).toUpperCase()} ⏳`);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "active") return o.status !== "Delivered" && o.status !== "Cancelled";
    if (activeTab === "completed") return o.status === "Delivered";
    return true;
  });

  const activeCount = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled").length;
  const completedCount = orders.filter((o) => o.status === "Delivered").length;
  const totalCashCollected = orders
    .filter((o) => o.isPaid && (o.paymentMethod === "COD" || !o.paymentMethod || o.paymentMethod === "Cash on Delivery"))
    .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);

  return (
    <div className="container animate-slide-up" style={{ padding: "3rem 1.5rem", minHeight: "80vh" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
          borderRadius: "var(--radius-md)",
          padding: "2rem",
          color: "#fff",
          marginBottom: "2rem",
          boxShadow: "0 10px 25px rgba(27,67,50,0.2)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600" }}>
              🛵 Delivery Agent Portal
            </span>
            <h1 style={{ fontSize: "2.2rem", marginTop: "0.5rem", marginBottom: "0.3rem", color: "#fff" }}>
              Hyper-Local Delivery Hub
            </h1>
            <p style={{ opacity: 0.9, margin: 0, fontSize: "1rem" }}>
              Driver ID: <strong>DLV-88219</strong> | Assigned Zone: <strong>District Center & Metro Region</strong>
            </p>
          </div>
          <button
            className="btn btn-sm"
            onClick={() => load(true)}
            style={{ background: "#fff", color: "var(--primary)", fontWeight: "bold", padding: "0.7rem 1.2rem", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <FiRefreshCw /> Refresh Orders
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginTop: "1.8rem" }}>
          <div style={{ background: "rgba(255,255,255,0.12)", padding: "1.2rem", borderRadius: "var(--radius-sm)", backdropFilter: "blur(5px)" }}>
            <span style={{ fontSize: "0.85rem", opacity: 0.85, display: "block" }}>Active Deliveries</span>
            <strong style={{ fontSize: "1.8rem" }}>{activeCount} Orders</strong>
          </div>
          <div style={{ background: "rgba(255,255,255,0.12)", padding: "1.2rem", borderRadius: "var(--radius-sm)", backdropFilter: "blur(5px)" }}>
            <span style={{ fontSize: "0.85rem", opacity: 0.85, display: "block" }}>Completed Today</span>
            <strong style={{ fontSize: "1.8rem" }}>{completedCount} Delivered</strong>
          </div>
          <div style={{ background: "rgba(255,255,255,0.12)", padding: "1.2rem", borderRadius: "var(--radius-sm)", backdropFilter: "blur(5px)" }}>
            <span style={{ fontSize: "0.85rem", opacity: 0.85, display: "block" }}>COD Cash Collected</span>
            <strong style={{ fontSize: "1.8rem" }}>₹{totalCashCollected.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "2px solid var(--border)", paddingBottom: "0.5rem" }}>
        <button
          onClick={() => setActiveTab("active")}
          style={{
            padding: "0.6rem 1.2rem",
            fontWeight: "bold",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: activeTab === "active" ? "var(--primary)" : "transparent",
            color: activeTab === "active" ? "#fff" : "var(--text)",
            cursor: "pointer"
          }}
        >
          📦 Active Deliveries ({activeCount})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          style={{
            padding: "0.6rem 1.2rem",
            fontWeight: "bold",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: activeTab === "completed" ? "var(--primary)" : "transparent",
            color: activeTab === "completed" ? "#fff" : "var(--text)",
            cursor: "pointer"
          }}
        >
          ✅ Completed ({completedCount})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          style={{
            padding: "0.6rem 1.2rem",
            fontWeight: "bold",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: activeTab === "all" ? "var(--primary)" : "transparent",
            color: activeTab === "all" ? "#fff" : "var(--text)",
            cursor: "pointer"
          }}
        >
          📋 All Orders ({orders.length})
        </button>
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Loading assigned deliveries...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="card text-center" style={{ padding: "4rem 2rem", borderStyle: "dashed" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🛵</div>
          <h3>No {activeTab === "active" ? "active" : activeTab === "completed" ? "completed" : ""} delivery orders found</h3>
          <p className="muted">Newly placed customer orders will appear here for pickup and door delivery.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          {filteredOrders.map((o) => {
            const assignedAgent = o.deliveryAgent;
            const isAssignedToMe = assignedAgent && (assignedAgent.id === user?._id || assignedAgent.id === user?.email || assignedAgent.name === user?.name || user?.role === "admin");
            const isLockedByOther = assignedAgent && !isAssignedToMe;

            return (
              <div
                key={o._id}
                className="card"
                style={{
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  opacity: isLockedByOther ? 0.75 : 1,
                  borderLeft: o.status === "Delivered" ? "6px solid #10b981" : o.status === "Out for Delivery" ? "6px solid #8b5cf6" : isAssignedToMe ? "6px solid #10b981" : "6px solid var(--primary)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <Link to={`/orders/${o._id}`} style={{ fontWeight: "bold", fontSize: "1.2rem", color: "var(--primary)" }}>
                        Order #{o._id.slice(-6).toUpperCase()}
                      </Link>
                      <span className="badge" style={{ background: o.deliverySlot?.includes("Morning") ? "#fef3c7" : "#e0e7ff", color: o.deliverySlot?.includes("Morning") ? "#92400e" : "#3730a3" }}>
                        {o.deliverySlot || "🌅 Morning Slot (7:00 AM - 10:00 AM)"}
                      </span>
                      {assignedAgent ? (
                        <span className="badge" style={{ background: isAssignedToMe ? "#d1fae5" : "#fef2f2", color: isAssignedToMe ? "#065f46" : "#991b1b", fontWeight: "bold" }}>
                          {isAssignedToMe ? "✅ Accepted by You" : `🔒 Accepted by ${assignedAgent.name}`}
                        </span>
                      ) : (
                        <span className="badge" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                          ⏳ Unassigned (Available to Accept)
                        </span>
                      )}
                    </div>
                    <span className="muted" style={{ fontSize: "0.85rem", display: "block", marginTop: "4px" }}>
                      Placed on: {new Date(o.createdAt || Date.now()).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>Order Amount</span>
                      <strong style={{ fontSize: "1.3rem", color: "var(--primary)" }}>₹{Number(o.totalPrice || 0).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Address & Contact Bar */}
                <div style={{ background: "var(--bg-soft)", padding: "1rem", borderRadius: "var(--radius-sm)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                  <div>
                    <strong style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", color: "var(--text)" }}>
                      <FiMapPin color="var(--primary)" /> Delivery Address
                    </strong>
                    <div style={{ fontSize: "0.9rem", marginTop: "4px", color: "var(--muted)" }}>
                      {o.user?.name || "Customer"}<br />
                      {o.shippingAddress?.address || "Street Address"},{" "}
                      {o.shippingAddress?.city || "Hyderabad"} - {o.shippingAddress?.postalCode || "500001"}
                    </div>
                  </div>

                  <div>
                    <strong style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", color: "var(--text)" }}>
                      <FiPhone color="var(--primary)" /> Customer Contact
                    </strong>
                    <div style={{ fontSize: "0.9rem", marginTop: "4px", color: "var(--muted)" }}>
                      Email: {o.user?.email || "customer@demo.com"}<br />
                      Phone: {o.shippingAddress?.phone || "+91 9876543210"}
                    </div>
                  </div>

                  <div>
                    <strong style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", color: "var(--text)" }}>
                      📦 Items Ordered ({o.items?.length || 0})
                    </strong>
                    <div style={{ fontSize: "0.85rem", marginTop: "4px", color: "var(--muted)" }}>
                      {o.items?.map((i) => `${i.quantity}x ${i.name}`).join(", ").slice(0, 60)}
                      {(o.items?.map((i) => `${i.quantity}x ${i.name}`).join(", ").length || 0) > 60 && "..."}
                    </div>
                  </div>
                </div>

                {/* Order Acceptance & Actions Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderTop: "1px dashed var(--border)", paddingTop: "1rem" }}>
                  {/* Order Acceptance Checkbox */}
                  <div>
                    {isLockedByOther ? (
                      <span style={{ fontSize: "0.85rem", background: "#fef2f2", color: "#991b1b", padding: "6px 12px", borderRadius: "6px", border: "1px solid #fca5a5", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <FiLock /> Locked by {assignedAgent.name}
                      </span>
                    ) : (
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", cursor: "pointer", userSelect: "none", background: isAssignedToMe ? "#ecfdf5" : "#fff", padding: "6px 14px", borderRadius: "6px", border: isAssignedToMe ? "1px solid #a7f3d0" : "1px solid var(--border)", color: isAssignedToMe ? "#065f46" : "var(--primary)", fontWeight: "bold" }}>
                        <input
                          type="checkbox"
                          checked={!!isAssignedToMe}
                          onChange={(e) => acceptOrder(o._id, e.target.checked)}
                          style={{ cursor: "pointer", width: "18px", height: "18px", accentColor: "var(--primary)" }}
                        />
                        <span>{isAssignedToMe ? "✅ Order Accepted & Locked to You" : "🛵 Check to Accept Order for Delivery"}</span>
                      </label>
                    )}
                  </div>

                  {/* Payment Checkbox & Status Update */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <span className={`badge ${o.isPaid ? "badge-organic" : "badge-discount"}`}>
                      {o.paymentMethod || "COD"} ({o.isPaid ? "Paid ✅" : "Pending ⏳"})
                    </span>

                    {(!o.paymentMethod || o.paymentMethod === "COD" || o.paymentMethod === "Cash on Delivery") && (
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: isAssignedToMe ? "pointer" : "not-allowed", opacity: isAssignedToMe ? 1 : 0.6, userSelect: "none", background: "#f0fdf4", padding: "6px 12px", borderRadius: "6px", border: "1px solid #bbf7d0", color: "#166534", fontWeight: "bold" }}>
                        <input
                          type="checkbox"
                          disabled={!isAssignedToMe}
                          checked={!!o.isPaid}
                          onChange={(e) => togglePayment(o._id, e.target.checked)}
                          style={{ cursor: isAssignedToMe ? "pointer" : "not-allowed", width: "16px", height: "16px", accentColor: "#16a34a" }}
                        />
                        <span>Mark COD Cash Collected</span>
                      </label>
                    )}

                    <select
                      disabled={!isAssignedToMe}
                      value={o.status || "Confirmed"}
                      onChange={(e) => updateStatus(o._id, e.target.value)}
                      style={{
                        padding: "0.4rem 0.8rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        opacity: isAssignedToMe ? 1 : 0.6,
                        cursor: isAssignedToMe ? "pointer" : "not-allowed",
                        background: o.status === "Delivered" ? "#d1fae5" : o.status === "Out for Delivery" ? "#ede9fe" : "#fff",
                        color: o.status === "Delivered" ? "#065f46" : o.status === "Out for Delivery" ? "#5b21b6" : "inherit"
                      }}
                    >
                      {DELIVERY_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s === "Out for Delivery" ? "🛵 Out for Delivery" : s === "Delivered" ? "✅ Delivered" : s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
