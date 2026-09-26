# 🚜 Farm to Home — Direct Farm-to-Consumer (F2C) E-Commerce Platform

**Farm to Home** is a full-stack Direct-to-Consumer (F2C) e-commerce web platform created and developed by **M. S. Charan**. The platform connects local Indian farmers directly with household consumers, eliminating traditional middlemen to guarantee **100% fresh, farm-harvested produce for buyers** and **fair, transparent 90% net earnings for farmers**.

---

## 🌐 Project Link & Live Application

*   **Official GitHub Repository:** [https://github.com/mscharan6303/Farm-to-home.git](https://github.com/mscharan6303/Farm-to-home.git)
*   **Live Deployed Application:** [https://farm-to-home.vercel.app](https://farm-to-home.vercel.app) *(or locally at `http://localhost:5173`)*

---

## 🔑 Demo Access Credentials

The platform features 4 distinct role-based access panels. Use these credentials to test each panel:

| User Role | Email Address | Password | Role Description & Access Rights |
| :--- | :--- | :--- | :--- |
| 🛒 **Customer (Buyer)** | `customer@demo.com` | `password123` | Access Customer Dashboard, browse marketplace, watch video ads, place orders, subscribe to FarmPass ₹499/mo, live chat with farmers. |
| 🌾 **Farmer (Seller)** | `farmer@demo.com` | `password123` | Access Farmer Dashboard, toggle harvesting status, manage product inventory, publish video ads, view net 90% earnings breakdown. |
| 🛵 **Delivery Agent** | `delivery@demo.com` | `password123` | Access Delivery Agent Panel, view hub orders, claim/lock delivery tasks, collect Cash on Delivery (COD) payments, mark orders as delivered. |
| 👑 **Platform Admin** | `admin@demo.com` | `password123` | Access Master Admin Panel across 5 control tabs (Financials & Clickable Statements, Product CRUD, Orders Override & Delivery Tracking, User Accounts, Video Ads Control). |

---

## 🖥️ Complete Breakdown of Platform Dashboards & Panels

### 1. 🛒 Customer Dashboard & Marketplace
![Customer Dashboard & Storefront](screenshots/home_v5.png)

**Key Features & Workflow:**
*   **Hero Storefront & Category Search:** Consumers can search for fresh produce across categories (Vegetables, Fruits, Leafy Greens, Dairy, Grains, Organic Products).
*   **📺 Promotional Farmer Video Ads Carousel:** Features continuous auto-playing video ads posted by farmers. Each video card includes direct **"🛒 Add to Cart"** and **"⚡ Order Now"** buttons overlaying product details. *(Note: If no video ad is active, this section auto-hides to keep the homepage 100% clean).*
*   **🌟 FarmPass Subscription Pass (₹499/month):** Customers can activate FarmPass Premium via an interactive **Online Payment Gateway Modal** (supporting Instant UPI `farmtohome@upi` and Debit/Credit Cards). Subscribing unlocks **Unlimited Free Shipping** and a **Flat 10% Extra Discount** across all purchases. Subscription status is **permanently saved** per account across logouts and logins.
*   **Dynamic Cart & Checkout:** Seamless multi-step checkout with address selection, UPI/COD payment choices, and instant receipt generation.
*   **Order Tracking & Socket.io Chat:** View order history (`My Orders`), live delivery status, and chat directly with farmers in real time.

---

### 2. 🌾 Farmer Dashboard & Seller Portal
![Farmer Dashboard](screenshots/farmer_dashboard_v5.png)

**Key Features & Workflow:**
*   **Harvesting Availability Toggle:** Farmers can switch their operational status between `🟢 Harvesting Active` and `🔴 Harvesting Paused`. When paused, customers are notified that harvesting is temporarily unavailable.
*   **Net 90% Earnings Breakdown:** Displays total listed products, orders received, gross sales revenue, 10% platform commission fee deducted, and **Net 90% Take-Home Earnings**.
*   **Inventory Management (CRUD):** Full produce catalog control — add new farm items, set MRP and discount prices, update stock levels, and upload produce images.
*   **📢 Promotional Video Ad Creator:** Farmers can publish video ads for their produce, mapping the video to a specific product and selecting active duration (**1 Day, 3 Days, 7 Days, 15 Days, or 30 Days**).

---

### 3. 🛵 Delivery Agent Panel & Logistics Hub
![Delivery Hub](screenshots/delivery_hub_v5.png)

**Key Features & Workflow:**
*   **Local Hub Aggregation View:** Displays daily morning produce packages dropped off by farmers at the centralized delivery hub.
*   **Single-Agent Order Acceptance Lock:** Delivery partners review available confirmed orders and check **"Accept Delivery Task"**. Once accepted, the task is locked to that specific delivery agent so no other driver can accept the same order.
*   **Cash on Delivery (COD) Payment Verification:** Allows delivery agents to collect cash payments upon doorstep handoff, toggle payment status to `Paid ✅`, and mark the order as `Delivered 🎉`.
*   **Customer & Address Transparency:** Displays customer name, contact phone number, and exact delivery address.

---

### 4. 👑 Master Platform Admin Control Center
![Admin Dashboard](screenshots/admin_dashboard_v5.png)

**Key Features & Workflow:**
The Platform Admin panel (`admin@demo.com`) provides master governance across 5 dedicated tabs:
1.  **📊 Financials & Payouts Tab:**
    *   Monetization analytics: Gross Platform Sales (GMV), 10% Platform Commission Retained, 90% Net Farmer Payouts, Total Net Profit.
    *   **Clickable Farmer Account Statements:** Clicking a farmer's name (`🌾 Demo Organic Farmer`) opens a detailed modal statement displaying total delivered sales, 90% farmer profit, 10% platform profit, and a line-by-line table of all delivered products.
    *   **Paid / Unpaid Status Selector:** Toggle farmer payout status between **Paid ✅** and **Unpaid / Pending ⏳**.
2.  **🥦 Product Catalog Master Control:** Master CRUD to Add, Edit, or Delete any product in the store catalog with instant live site synchronization.
3.  **📦 Orders Master Control:** Order status overrides, COD payment overrides, order deletion, and **Assigned Delivery Agent Details** (showing driver name, email, and fulfillment badge).
4.  **👥 User & Accounts Directory:** Manage registered Customer, Farmer, Delivery Agent, and Admin accounts with activate/suspend options.
5.  **📹 Video Ads Control:** Admin control over all farmer video ads, enabling platform-wide ad creation or removal.

---

## 🏗️ Platform Monetization & Business Architecture

```
[ Customer Order ] ➔ 100% Total Gross Payment
                        │
                        ├─► 90% Transferred to Farmer (Net Farmer Payout)
                        └─► 10% Retained by Platform Owner (Platform Commission Fee)
```

1.  **Platform Fee (10% Commission):** Platform owner retains 10% on gross produce sales.
2.  **Net Farmer Payout (90% Earnings):** Farmers receive 90% net payout on all delivered products.
3.  **Delivery Fee Stream:** ₹49 standard shipping charge on non-premium orders under ₹300 (Free for FarmPass Members).

---

## 🛠️ Technology Stack

*   **Frontend:** React.js, Vite, Context API (Auth & Cart), Custom Responsive CSS, React Icons.
*   **Backend:** Node.js, Express.js REST API.
*   **Database:** MongoDB & Mongoose.
*   **Real-Time & Sync:** Socket.io, CloudSync Event Listeners.
*   **Media & Video:** Cloudinary, HTML5 Video & YouTube Embeds.

---

## 💻 How to Run Locally

### 1. Clone Repository & Setup Backend
```bash
git clone https://github.com/mscharan6303/Farm-to-home.git
cd Farm-to-home/backend
npm install
npm run dev
```

### 2. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser!

---

## 📜 Credits & License

Developed and created by **M. S. Charan**. Designed to empower local Indian farmers, promote sustainable agriculture, and deliver fresh produce directly to household doorsteps.
