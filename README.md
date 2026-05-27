# Farm to Home 🌾

Full-stack MERN agricultural e-commerce platform connecting farmers directly with consumers.

## Tech Stack

- **Core Technologies:** ReactJS, Node.js, Express.js, MongoDB, HTML5, CSS3
- **Additional Tools:** Socket.IO (Real-time chat), JWT (Authentication), Mongoose, Vite
- **Third-Party Services:** Cloudinary (Image Hosting)

## Project Structure

```
farm-to-home/
├── backend/        # Express + MongoDB API
└── frontend/       # React app (Vite)
```

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB (local) or MongoDB Atlas URI
- Cloudinary account (free tier works)

### 2. Backend setup
```bash
cd backend
cp .env.example .env       # fill in your values
npm install
npm run dev                # starts on http://localhost:5000
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev                # starts on http://localhost:5173
```

### 4. Seed an admin (optional)
After the backend is running, register a user, then in MongoDB shell:
```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## Environment Variables (backend/.env)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/farm-to-home
JWT_SECRET=your_long_random_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLIENT_URL=http://localhost:5173
```

## How to Use the Application

### 1. Home Page & Browsing
The application opens to a beautifully designed homepage featuring an Indian agricultural aesthetic. Consumers can browse fresh produce easily.
![Home Page](screenshots/home.png)

### 2. Authentication
Consumers and Farmers share a unified login page.
![Login Page](screenshots/login.png)
- **Farmers**: Can log in using their registered email and password to access the Farmer Dashboard.
- **Consumers**: Can register a new account or log in to start buying.

### 3. Purchasing Products (Consumer)
Consumers can browse the diverse selection of products categorized by Indian names and filter by organic status or category.
![Products Page](screenshots/products.png)
- Select the quantity you want.
- Add products to your Cart.
- Check out quickly using Cash on Delivery (COD).
- View your **My Orders** page directly from the navbar!

### 4. Managing the Farm (Farmer)
Farmers are automatically redirected to their dedicated dashboard.
![Farmer Dashboard](screenshots/farmer_dashboard.png)
- **My Products**: Add new products, specifying their categories, prices, and even setting the appropriate unit (like Litres for milk or Kilograms for vegetables).
- **Current Orders**: View and manage the status of all active orders placed by consumers. Update statuses from "Pending" to "Out for Delivery".
- **Delivered Orders**: A dedicated view for successfully fulfilled orders.
- **Messages**: Chat in real-time with consumers who are interested in your products!

## Features

- JWT auth with 3 roles (consumer / farmer / admin)
- Product CRUD with multi-image Cloudinary upload
- Cart, wishlist, and fully functional Cash on Delivery
- Consumer and Farmer dedicated Order workflows
- Live real-time chat (Socket.IO) between farmer & consumer
- Search, filter, sort, pagination
- Responsive UI with Indian agricultural theme (sage / cream)
- Instant Translation functionality via Google Translate

## API Endpoints

See `backend/routes/` for the full list. Highlights:
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`
- `GET|POST /api/products`, `GET|PUT|DELETE /api/products/:id`
- `GET|POST /api/cart`, `DELETE /api/cart/remove/:id`
- `POST /api/orders`, `GET /api/orders/myorders`, `PUT /api/orders/status/:id`
- `POST /api/reviews`, `GET /api/reviews/:productId`
- `GET /api/chat`, `POST /api/chat/message`
- `GET /api/admin/users`, `GET /api/admin/analytics`

## Deployment

- **Frontend** → Vercel / Netlify (set `VITE_API_URL=https://your-backend.onrender.com`)
- **Backend** → Render / Railway (set all env vars)
- **DB** → MongoDB Atlas

## License
MIT
