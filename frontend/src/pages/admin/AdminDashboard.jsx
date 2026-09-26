import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { getAllSyncedOrders, subscribeToSyncEvents, notifySyncListeners } from "../../services/cloudSync";
import toast from "react-hot-toast";
import { FiDollarSign, FiTrendingUp, FiShoppingBag, FiUsers, FiPieChart, FiRefreshCw, FiTruck } from "react-icons/fi";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const allSynced = await getAllSyncedOrders();
      let apiOrders = [];
      try {
        const res = await api.get("/orders");
        if (Array.isArray(res.data)) apiOrders = res.data;
      } catch (e) {}

      const map = new Map();
      allSynced.forEach((o) => o && o._id && map.set(o._id, o));
      apiOrders.forEach((o) => o && o._id && map.set(o._id, { ...map.get(o._id), ...o }));

      // Status & Payment overrides
      let statusOverrides = {};
      let paymentOverrides = {};
      try {
        statusOverrides = JSON.parse(localStorage.getItem("farmer_order_status_overrides") || "{}");
        paymentOverrides = JSON.parse(localStorage.getItem("farmer_order_payment_overrides") || "{}");
      } catch (e) {}

      const list = Array.from(map.values())
        .filter((o) => o._id !== "ORD-1790402239214")
        .map((o) => {
          const copy = { ...o };
          if (statusOverrides[copy._id]) copy.status = statusOverrides[copy._id];
          if (paymentOverrides[copy._id] !== undefined) copy.isPaid = paymentOverrides[copy._id];
          return copy;
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setOrders(list);
    } catch (err) {
      console.warn("Failed to load admin orders:", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const unsubscribe = subscribeToSyncEvents(() => load(false));
    const timer = setInterval(() => load(false), 5000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  // Platform Monetization Calculations
  const grossGMV = orders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
  const platformCommissionRate = 0.10; // 10% Platform Fee
  const platformCommissionEarned = grossGMV * platformCommissionRate;
  const netFarmerPayouts = grossGMV * (1 - platformCommissionRate);
  const totalDeliveryFees = orders.reduce((sum, o) => sum + Number(o.deliveryCharge || (o.totalPrice > 0 ? 30 : 0)), 0);
  const totalPlatformNetProfit = platformCommissionEarned + totalDeliveryFees;

  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
  const activeCount = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled").length;

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
    <div className="container animate-slide-up" style={{ padding: "3rem 1.5rem", minHeight: "85vh" }}>
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
              👑 Platform Owner Portal
            </span>
            <h1 style={{ fontSize: "2.2rem", marginTop: "0.5rem", marginBottom: "0.3rem", color: "#fff" }}>
              Platform Revenue & Monetization Analytics
            </h1>
            <p style={{ opacity: 0.85, margin: 0, fontSize: "0.95rem" }}>
              Logged in as: <strong>admin@demo.com</strong> (Farm to Home Platform Owner)
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn btn-sm"
              onClick={() => load(true)}
              style={{ background: "var(--primary)", color: "#fff", padding: "0.6rem 1.2rem", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FiRefreshCw /> Refresh Financials
            </button>
          </div>
        </div>

        {/* Financial Metrics Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.2rem", marginTop: "2rem" }}>
          <div style={{ background: "rgba(255,255,255,0.08)", padding: "1.2rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: "0.85rem", opacity: 0.8, display: "block" }}>Gross Platform Sales (GMV)</span>
            <strong style={{ fontSize: "1.8rem", color: "#38bdf8" }}>₹{grossGMV.toFixed(2)}</strong>
            <span style={{ fontSize: "0.78rem", display: "block", marginTop: "4px", opacity: 0.7 }}>Across {orders.length} total orders</span>
          </div>

          <div style={{ background: "rgba(255,255,255,0.08)", padding: "1.2rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: "0.85rem", opacity: 0.8, display: "block" }}>10% Platform Commission</span>
            <strong style={{ fontSize: "1.8rem", color: "#4ade80" }}>₹{platformCommissionEarned.toFixed(2)}</strong>
            <span style={{ fontSize: "0.78rem", display: "block", marginTop: "4px", opacity: 0.7 }}>Direct Platform Fee (10%)</span>
          </div>

          <div style={{ background: "rgba(255,255,255,0.08)", padding: "1.2rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: "0.85rem", opacity: 0.8, display: "block" }}>Net Farmer Payouts (90%)</span>
            <strong style={{ fontSize: "1.8rem", color: "#fbbf24" }}>₹{netFarmerPayouts.toFixed(2)}</strong>
            <span style={{ fontSize: "0.78rem", display: "block", marginTop: "4px", opacity: 0.7 }}>Transferred to registered farmers</span>
          </div>

          <div style={{ background: "rgba(255,255,255,0.08)", padding: "1.2rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: "0.85rem", opacity: 0.8, display: "block" }}>Total Platform Net Profit</span>
            <strong style={{ fontSize: "1.8rem", color: "#a7f3d0" }}>₹{totalPlatformNetProfit.toFixed(2)}</strong>
            <span style={{ fontSize: "0.78rem", display: "block", marginTop: "4px", opacity: 0.7 }}>Commission + Delivery Fees</span>
          </div>
        </div>
      </div>

      {/* Per-Farmer Payout Classification Table */}
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
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
                <th style={{ padding: "1rem" }}>10% Platform Fee Deducted</th>
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

      {/* Orders Commission Split Breakdown Table */}
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
        <FiPieChart color="var(--primary)" /> Per-Order Revenue & Commission Breakdown
      </h2>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Loading financial orders data...</div>
      ) : orders.length === 0 ? (
        <div className="card text-center" style={{ padding: "3rem", borderStyle: "dashed" }}>
          <h3>No transactions recorded yet</h3>
        </div>
      ) : (
        <div className="table-responsive" style={{ background: "#fff", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-soft)", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "1rem" }}>Order ID</th>
                <th style={{ padding: "1rem" }}>Customer</th>
                <th style={{ padding: "1rem" }}>Date</th>
                <th style={{ padding: "1rem" }}>Gross Total</th>
                <th style={{ padding: "1rem" }}>10% Platform Fee</th>
                <th style={{ padding: "1rem" }}>90% Farmer Payout</th>
                <th style={{ padding: "1rem" }}>Delivery Slot</th>
                <th style={{ padding: "1rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const total = Number(o.totalPrice || 0);
                const comm = total * 0.10;
                const farmerCut = total * 0.90;
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
                    <td style={{ padding: "1rem", fontWeight: "bold", color: "var(--text)" }}>
                      ₹{total.toFixed(2)}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "bold", color: "#16a34a" }}>
                      +₹{comm.toFixed(2)}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "600", color: "#d97706" }}>
                      ₹{farmerCut.toFixed(2)}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.8rem" }}>
                      <span className="badge" style={{ background: "#f3f4f6", color: "#374151" }}>
                        {o.deliverySlot || "🌅 Morning Slot"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className={`badge ${o.status === "Delivered" ? "badge-organic" : o.status === "Cancelled" ? "badge-danger" : "badge-discount"}`}>
                        {o.status || "Pending"} ({o.isPaid ? "Paid ✅" : "COD Pending ⏳"})
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
