# 🔐 SecurePass – Intelligent Password-less Authentication System

A production-grade SaaS cybersecurity product featuring risk-based adaptive authentication, OTP verification, face recognition, and real-time security analytics.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas URI)
- npm v9+

### 1. Clone & Install
```bash
# Install root dependencies
npm install

# Install all project dependencies at once
npm run install:all
```

### 2. Configure Environment
```bash
# Backend config
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and secrets
```

### 3. Run Development Servers
```bash
# Run both frontend and backend simultaneously
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## 📁 Project Structure

```
securepass/
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/            # Login, OTP, Face, Dashboard
│   │   ├── components/       # Reusable UI components
│   │   ├── services/         # Axios API layer
│   │   ├── hooks/            # Custom React hooks
│   │   └── context/          # Auth context
│   └── ...
├── backend/                  # Node.js + Express + MongoDB
│   ├── config/               # DB connection
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API routes
│   ├── controllers/          # Business logic
│   └── middleware/           # Auth, rate-limit, logging
├── package.json              # Root scripts
└── README.md
```

---

## 🔐 Authentication Flow

```
User enters Email/Phone
        ↓
Risk Engine Evaluation
        ↓
┌───────────────────────────┐
│  LOW    → Direct Login    │
│  MEDIUM → OTP Required    │
│  HIGH   → OTP + Face ID   │
└───────────────────────────┘
        ↓
Dashboard (with full analytics)
```

---

## 🛠️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS      |
| Animation | Framer Motion                     |
| Charts    | Recharts                          |
| Backend   | Node.js, Express.js               |
| Database  | MongoDB + Mongoose                |
| Auth      | JWT, bcrypt                       |
| Dev Tools | concurrently, nodemon             |

---

## 🌐 API Endpoints

| Method | Endpoint          | Description                    |
|--------|-------------------|--------------------------------|
| POST   | /api/login        | Initiate login, get risk level |
| POST   | /api/verify-otp   | Verify OTP code                |
| POST   | /api/verify-face  | Submit face verification       |
| GET    | /api/dashboard    | Get user analytics & history   |

---

## 🎨 Design System

- **Background**: `#03061a` (Deep Space Navy)
- **Primary Accent**: `#00e5ff` (Neon Cyan)
- **Secondary**: `#00ff9d` (Matrix Green)
- **Theme**: Dark Cyberpunk + Glassmorphism
- **Fonts**: Orbitron, Oxanium, Fira Code

---

## 📦 Environment Variables

```env
# backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/securepass
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

---

## 🧪 Testing the Full Flow

1. Open http://localhost:5173
2. Enter any email (e.g. `demo@securepass.io`)
3. The risk engine will classify your session
4. Complete MFA steps based on risk level
5. View your dashboard with live analytics

---

## 📄 License

MIT © SecurePass 2025
