# 💳 PayFlow — Production-Ready Payment Gateway

A full-stack, production-ready payment gateway built with **React 19**, **Node.js**, **Express**, **MongoDB**, and **Razorpay**. Includes complete authentication (JWT + refresh tokens, email verification, password reset), customer & admin dashboards, Razorpay checkout with backend signature verification, invoice PDF generation, email receipts, refunds, webhooks, and analytics.

---

## ✨ Features

### Authentication
- Register / Login / Logout
- JWT access tokens + refresh tokens (secure HTTP-only cookies)
- Email verification
- Forgot / Reset password
- Protected routes (customer & admin)

### Payments (Razorpay)
- Create order on backend
- Razorpay Checkout (frontend)
- Backend signature verification — **never trust the frontend**
- Payment capture & failure handling
- Duplicate payment prevention (idempotency)
- Refund API with admin approval
- Webhook handling with signature validation
- Secure storage of Razorpay IDs

### Dashboards
- **Customer:** total payments, recent payments, download invoice, request refund, profile, settings
- **Admin:** revenue (daily/monthly), orders, payments, refunds, pending requests, user management, charts & analytics

### Extras
- Invoice PDF generation (PDFKit)
- Email receipts (Nodemailer)
- Transaction search, pagination, sorting, filtering
- Webhook & admin logs
- Profile picture upload (Multer)
- Dark mode, glassmorphism, responsive mobile-first UI
- Skeleton loaders, empty states, error pages, smooth animations

---

## 🧱 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Axios, React Hook Form, React Hot Toast, Framer Motion, Recharts |
| Backend | Node.js, Express, MongoDB + Mongoose, JWT, bcrypt, Razorpay SDK, PDFKit, Nodemailer, Multer, Helmet, Express Rate Limit, CORS, Morgan, dotenv |
| Deployment | Frontend → Vercel, Backend → Render/Railway, DB → MongoDB Atlas |

---

## 📁 Folder Structure

```
payflow/
├── client/                  # React frontend
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── services/
│       ├── utils/
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
├── server/                  # Node backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   ├── uploads/
│   ├── .env.example
│   ├── server.js
│   └── seed.js
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- Razorpay test keys ([dashboard.razorpay.com](https://dashboard.razorpay.com))

### 1. Clone & install

```bash
git clone <your-repo-url> PayFlow
cd PayFlow
npm run install:all
```

### 2. Configure environment

**Server** — copy `server/.env.example` to `server/.env` and fill in values:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/payflow
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=PayFlow <you@gmail.com>
```

**Client** — copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxx
```

### 3. Run in development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### 4. Seed sample data

```bash
npm run seed
```

Creates an admin user, sample customers, orders, payments, refunds, and invoices.

**Default seeded users:**
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@payflow.com` | `Admin@123` |
| Customer | `john@example.com` | `Customer@123` |

---

## 🔐 Security

- JWT access + refresh tokens in HTTP-only, `SameSite` cookies
- bcrypt password hashing (12 rounds)
- Helmet security headers
- CORS restricted to configured origin
- Express rate limiting on auth & payment routes
- Input validation (express-validator)
- XSS & NoSQL injection protection (express-mongo-sanitize, xss-clean)
- Razorpay webhook signature verification
- Backend-only payment verification (never trust frontend)
- Duplicate payment prevention via idempotency keys
- Environment variables for all secrets

---

## 🔄 Payment Flow

```
User → Checkout Page → Backend creates Razorpay Order
→ Razorpay Checkout opens → Payment Success
→ Backend verifies signature → Stores payment
→ Generates invoice PDF → Sends email receipt
→ Shows success page
```

---

## 📡 API Overview

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register user | Public |
| POST | `/api/auth/login` | Login | Public |
| POST | `/api/auth/logout` | Logout | Auth |
| POST | `/api/auth/refresh` | Refresh token | Public (cookie) |
| GET | `/api/auth/verify-email/:token` | Verify email | Public |
| POST | `/api/auth/forgot-password` | Request reset | Public |
| POST | `/api/auth/reset-password/:token` | Reset password | Public |
| GET | `/api/auth/me` | Current user | Auth |
| PUT | `/api/auth/profile` | Update profile | Auth |
| POST | `/api/auth/avatar` | Upload avatar | Auth |
| POST | `/api/payments/create-order` | Create Razorpay order | Auth |
| POST | `/api/payments/verify` | Verify payment | Auth |
| POST | `/api/payments/refund` | Request refund | Auth |
| GET | `/api/payments/history` | Payment history | Auth |
| GET | `/api/orders` | List orders | Auth |
| GET | `/api/orders/:id` | Order detail | Auth |
| GET | `/api/invoices/:id` | Download invoice PDF | Auth |
| POST | `/api/webhooks/razorpay` | Razorpay webhook | Webhook |
| GET | `/api/admin/stats` | Dashboard stats | Admin |
| GET | `/api/admin/payments` | All payments | Admin |
| GET | `/api/admin/orders` | All orders | Admin |
| GET | `/api/admin/refunds` | All refunds | Admin |
| PUT | `/api/admin/refunds/:id/approve` | Approve refund | Admin |
| GET | `/api/admin/users` | List users | Admin |
| PATCH | `/api/admin/users/:id` | Update user | Admin |
| DELETE | `/api/admin/users/:id` | Delete user | Admin |
| GET | `/api/admin/logs` | Admin/webhook logs | Admin |

---

## ☁️ Deployment

### Frontend → Vercel
1. Push repo to GitHub.
2. Import in Vercel, set root directory to `client`.
3. Build command: `npm run build`, output: `dist`.
4. Add env vars: `VITE_API_URL`, `VITE_RAZORPAY_KEY_ID`.

### Backend → Render / Railway
1. Create a new Web Service pointing at the repo.
2. Root directory: `server`.
3. Build: `npm install`, Start: `npm start`.
4. Add all env vars from `.env.example`.
5. Use MongoDB Atlas connection string.

### MongoDB Atlas
1. Create a free cluster.
2. Create a database user.
3. Whitelist your IP / allow all (0.0.0.0/0 for production).
4. Use the connection string in `MONGO_URI`.

---

## 🧪 Testing

```bash
# Backend
cd server
npm test

# Frontend
cd client
npm test
```

Manual test checklist:
1. Register → verify email → login.
2. Create a payment → complete Razorpay test checkout (use test card `4111 1111 1111 1111`, any future expiry, any CVV).
3. Verify payment appears in history + invoice downloads + email received.
4. Request a refund → approve as admin.
5. Test forgot/reset password flow.
6. Test admin dashboard analytics & user management.

---

## 📄 License

MIT