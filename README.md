# ⚛ AtomQuest Hackathon 1.0 — Goal Setting & Tracking Portal

A full-stack web application built for the AtomQuest Hackathon problem statement: an in-house Goal Setting & Tracking Portal covering the complete lifecycle of employee goals.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd atomquest

# Install root deps
npm install

# Install backend
cd backend && npm install && cd ..

# Install frontend
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env — set your MONGODB_URI and JWT_SECRET
```

**backend/.env**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/atomquest
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Seed Demo Data

```bash
cd backend
npm run seed
```

This creates:
| Role     | Email                       | Password       |
|----------|-----------------------------|----------------|
| Admin    | admin@atomquest.com         | Admin@123      |
| Manager  | manager@atomquest.com       | Manager@123    |
| Employee | employee@atomquest.com      | Employee@123   |

### 4. Run Development Servers

From the project root:
```bash
npm run dev
```

Or individually:
```bash
npm run dev:backend   # API on http://localhost:5000
npm run dev:frontend  # UI  on http://localhost:5173
```

Open http://localhost:5173 → use Quick Login buttons on the login page.

---

## 🏗️ Architecture

```
atomquest/
├── backend/                   # Node.js + Express REST API
│   └── src/
│       ├── models/            # Mongoose schemas
│       │   ├── User.js        # Employee / Manager / Admin
│       │   ├── Goal.js        # Goal sheet + goal items
│       │   ├── Cycle.js       # Performance cycle config
│       │   └── AuditLog.js    # Immutable change trail
│       ├── routes/            # REST route handlers
│       │   ├── auth.js        # Login, /me
│       │   ├── users.js       # CRUD users (Admin)
│       │   ├── goals.js       # Full goal lifecycle
│       │   ├── cycles.js      # Cycle management
│       │   ├── reports.js     # Achievement + completion reports
│       │   └── audit.js       # Audit log query
│       ├── middleware/
│       │   └── auth.js        # JWT protect + role guard
│       ├── utils/
│       │   └── seed.js        # Demo data seeder
│       └── server.js          # Express app entry
│
├── frontend/                  # React 18 + Vite SPA
│   └── src/
│       ├── pages/             # One file per route
│       │   ├── LoginPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── GoalsPage.jsx
│       │   ├── GoalFormPage.jsx
│       │   ├── GoalDetailPage.jsx
│       │   ├── TeamGoalsPage.jsx
│       │   ├── CheckinPage.jsx
│       │   ├── ReportsPage.jsx
│       │   ├── AdminUsersPage.jsx
│       │   ├── AdminCyclesPage.jsx
│       │   └── AuditPage.jsx
│       ├── components/shared/
│       │   └── Layout.jsx     # Sidebar + outlet
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── utils/
│       │   └── api.js         # Axios instance with JWT interceptor
│       ├── App.jsx            # Router + protected routes
│       └── index.css          # Design system (CSS variables)
│
├── docs/                      # Architecture diagram
└── package.json               # Root monorepo scripts
```

### Tech Stack

| Layer      | Technology                       |
|------------|----------------------------------|
| Frontend   | React 18, React Router 6, Vite   |
| Charts     | Recharts                         |
| Backend    | Node.js, Express 4               |
| Database   | MongoDB + Mongoose               |
| Auth       | JWT (jsonwebtoken + bcryptjs)    |
| Icons      | Lucide React                     |
| Toasts     | react-hot-toast                  |

---

## 📋 Feature Coverage

### Phase 1 — Goal Creation & Approval ✅
- Employee creates goal sheet with up to 8 goals
- Select Thrust Area, Goal Title/Description
- Choose UoM: Numeric ↑, Numeric ↓, % ↑, % ↓, Timeline, Zero-based
- Set Target and Weightage per goal
- **Validation rules enforced:**
  - Total weightage must equal 100%
  - Minimum 10% per goal
  - Maximum 8 goals
- Manager (L1) Approval Workflow:
  - Review submitted goals
  - Inline edit targets/weightages before approving
  - Return for rework with comments
  - On approval → goals locked
- Shared Goals: Admin/Manager pushes KPIs to multiple employees

### Phase 2 — Achievement Tracking & Quarterly Check-ins ✅
- Quarterly update interface (Q1–Q4 actuals)
- Status per goal: Not Started / On Track / Completed
- Manager Check-in module with structured comment
- **Auto-computed progress scores:**
  - Numeric ↑ (Min): Achievement ÷ Target × 100
  - Numeric ↓ (Max): Target ÷ Achievement × 100
  - Timeline: Completion vs. Deadline
  - Zero-based: 0 → 100%, else 0%

### Reporting & Governance ✅
- Achievement Report (JSON view + CSV export)
- Completion Dashboard (check-in status per employee)
- Audit Trail — every post-lock change logged

### User Roles ✅
| Role     | Capabilities |
|----------|-------------|
| Employee | Create/edit goals, submit, enter actuals |
| Manager  | Approve/return, check-ins, team dashboard |
| Admin    | User management, cycle config, audit log, unlock |

---

## 🔌 API Reference

### Auth
| Method | Path              | Access | Description  |
|--------|-------------------|--------|--------------|
| POST   | /api/auth/login   | Public | Login        |
| GET    | /api/auth/me      | Any    | Current user |

### Goals
| Method | Path                       | Access          | Description              |
|--------|----------------------------|-----------------|--------------------------|
| GET    | /api/goals/my              | Employee        | Own goal sheets          |
| GET    | /api/goals/team            | Manager/Admin   | Team goal sheets         |
| GET    | /api/goals/all             | Admin           | All goal sheets          |
| GET    | /api/goals/:id             | Any             | Single sheet detail      |
| POST   | /api/goals                 | Employee        | Create/save draft        |
| PATCH  | /api/goals/:id/submit      | Employee        | Submit for approval      |
| PATCH  | /api/goals/:id/approve     | Manager/Admin   | Approve (lock)           |
| PATCH  | /api/goals/:id/return      | Manager/Admin   | Return for rework        |
| PATCH  | /api/goals/:id/unlock      | Admin           | Unlock after lock        |
| PATCH  | /api/goals/:id/actuals     | Employee        | Enter quarterly actuals  |
| PATCH  | /api/goals/:id/checkin     | Manager/Admin   | Add check-in comment     |
| POST   | /api/goals/shared          | Manager/Admin   | Push shared goal         |

### Users, Cycles, Reports, Audit
- `GET/POST/PATCH /api/users` — Admin user management
- `GET/POST/PATCH /api/cycles` — Cycle CRUD + activate
- `GET /api/reports/achievement` — Achievement report (add `?format=csv` for download)
- `GET /api/reports/completion` — Check-in completion dashboard
- `GET /api/audit` — Audit log (Admin)

---

## ☁️ Deployment Guide

### Option A: Render (Free Tier)

**Backend:**
1. Create a new Web Service on render.com
2. Connect your GitHub repo
3. Build command: `cd backend && npm install`
4. Start command: `node backend/src/server.js`
5. Add environment variables from `.env.example`
6. Use MongoDB Atlas for the database

**Frontend:**
1. Create a new Static Site on render.com
2. Build command: `cd frontend && npm install && npm run build`
3. Publish directory: `frontend/dist`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`

> Update `frontend/vite.config.js` proxy target to your backend URL for production.

### Option B: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

### Option C: Docker

```dockerfile
# See docs/docker-compose.yml for a ready-to-use setup
```

---

## 🧪 Demo User Journeys

### Employee Journey
1. Log in as `employee@atomquest.com`
2. Go to **My Goals** → **New Goal Sheet**
3. Add 4 goals, distribute weightage to total 100%
4. Click **Save & Submit for Approval**

### Manager Journey
1. Log in as `manager@atomquest.com`
2. Go to **Team Goals** → see submitted sheets
3. Click **Approve** (or **Return** with reason)
4. After Q1 opens: **Check-in** → enter discussion notes

### Admin Journey
1. Log in as `admin@atomquest.com`
2. Go to **Admin → Cycles** → create / activate a cycle
3. Go to **Admin → Users** → add employees and assign managers
4. Go to **Reports** → export achievement CSV
5. Go to **Admin → Audit Log** → view all changes

---

## 📐 Validation Rules (BRD Enforced)

| Rule                        | Where Enforced           |
|-----------------------------|--------------------------|
| Max 8 goals per employee    | Frontend + Backend       |
| Min 10% weightage per goal  | Frontend + Backend       |
| Total weightage = 100%      | Frontend + Backend       |
| Goals locked after approval | Backend (status check)   |
| Only Admin can unlock       | Backend (role guard)     |
| Actuals only on locked goals| Backend (status check)   |

---

## 🏆 Bonus Features Implemented

- ✅ **CSV Export** — Achievement Report downloadable as Excel-compatible CSV
- ✅ **Audit Trail** — Every post-lock action logged with actor, action, timestamp
- ✅ **Shared Goals** — Admin/Manager can push departmental KPIs
- ✅ **Score Computation** — Auto-calculated per UoM formula (cached on save)
- ✅ **Analytics Tab** — Department-wise Q1 average score bar chart
- ✅ **Completion Dashboard** — Real-time check-in completion matrix

---

## 📄 License

Built for AtomQuest Hackathon 1.0. Internal use only.
