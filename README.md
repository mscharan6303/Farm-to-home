# Farm to Home 🌾

Full-stack MERN agricultural e-commerce platform connecting farmers directly with consumers.

## Tech Stack

**Frontend:** React 18, React Router DOM v6, Axios, Context API, Vite, Socket.IO Client
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Multer, Cloudinary, Socket.IO
**Payments:** Razorpay (test keys)

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
- Razorpay test account (optional — COD works without it)

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
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
CLIENT_URL=http://localhost:5173
```

## Features

- JWT auth with 3 roles (consumer / farmer / admin)
- Product CRUD with multi-image Cloudinary upload
- Cart, wishlist, COD + Razorpay checkout
- Orders with status timeline
- Reviews & ratings
- Real-time chat (Socket.IO) between farmer & consumer
- Admin dashboard (user/product/order management)
- Search, filter, sort, pagination
- Responsive UI with Indian agricultural theme (sage / cream)

## API Endpoints

See `backend/routes/` for the full list. Highlights:
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`
- `GET|POST /api/products`, `GET|PUT|DELETE /api/products/:id`
- `GET|POST /api/cart`, `DELETE /api/cart/remove/:id`
- `POST /api/orders`, `GET /api/orders/myorders`, `PUT /api/orders/status/:id`
- `POST /api/reviews`, `GET /api/reviews/:productId`
- `POST /api/payment/create`, `POST /api/payment/verify`
- `GET /api/chat`, `POST /api/chat/message`
- `GET /api/admin/users`, `GET /api/admin/analytics`

## Deployment

- **Frontend** → Vercel / Netlify (set `VITE_API_URL=https://your-backend.onrender.com`)
- **Backend** → Render / Railway (set all env vars)
- **DB** → MongoDB Atlas

## License
MIT
