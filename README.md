# FixIt QR — Smart Campus Maintenance System

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)

An academic, production-minded campus maintenance operations platform designed for universities and colleges. **FixIt QR** streamlines equipment failure reporting through physical QR code stickers, automates ticket routing, enforces role-based work orders, and empowers administrators with real-time maintenance analytics.

---

## 1. System Architecture

FixIt QR is structured as a decoupled full-stack application:

```
fixit-qr/
├── client/                     # Frontend Application (React 18, Vite, Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Shared UI (Navbar, Sidebar, Badges, StatCards, QrModal)
│   │   ├── context/            # AuthContext (Supabase Auth & Role-Based Access)
│   │   ├── lib/                # API client & Supabase initialization
│   │   ├── pages/              # Role dashboards, QR landing, problem reporting
│   │   └── index.css           # Campus editorial design system
│   └── vite.config.js          # Vite config & API reverse proxy
│
├── server/                     # Backend REST API (Node.js, Express.js)
│   ├── src/
│   │   ├── lib/                # Supabase client & scoped RLS client
│   │   ├── middleware/         # Bearer token verification, role enforcement, error handling
│   │   ├── routes/             # REST endpoints (/health, /me, /equipment, /complaints, /admin)
│   │   └── app.js              # Express app
│   └── test/                   # Integration tests (Vitest, Supertest)
│
├── supabase/
│   └── migrations/             # Version-controlled SQL migrations
│       ├── 001_initial_schema.sql  # 10 Core tables, foreign keys, triggers
│       ├── 002_rls_policies.sql    # Fine-grained Row Level Security policies
│       └── 003_seed_data.sql       # Fictional campus seed data (SEC, RCC, CUL)
│
├── .env.example                # Configuration template
└── package.json                # Workspaces orchestration
```

---

## 2. Role-Based Access Control (RBAC)

The system enforces four distinct operational roles:

| Role | Permissions & Workspace |
| :--- | :--- |
| **Student / Faculty** | Scan equipment QR codes, lodge complaints with photos, track status timeline, submit 1–5 star resolution feedback, request ticket reopening. |
| **Maintenance Staff** | View assigned work orders, accept jobs (`in_progress`), add technical repair notes, upload completion photos, mark work `resolved`. |
| **College Admin** | Campus-wide overview, dispatch & assign technicians, manage buildings/rooms, register equipment & print QR stickers, export CSV reports. |
| **System Admin** | Provision user accounts, assign/revoke roles, activate/deactivate accounts, inspect tamper-proof audit logs. |

---

## 3. Database Schema & RLS

All database tables are governed by strict PostgreSQL Row Level Security:

1. `profiles`: User identity, roles (`student`, `faculty`, `technician`, `admin`, `system_admin`), and active flags.
2. `buildings`: Campus physical infrastructure (e.g. Science Complex, Computer Center).
3. `rooms`: Classrooms, labs, and lecture halls with unique floor/room constraints.
4. `equipment`: Registered electrical, HVAC, and AV equipment with unguessable `qr_token` fields.
5. `complaints`: Sequential ticket numbers (`CMP-YYYYMM-XXXX`), priorities, statuses (`pending`, `in_progress`, `resolved`, `reopened`).
6. `complaint_assignments`: Historical record of technician dispatches.
7. `complaint_status_history`: Audited state transition log.
8. `complaint_feedback`: Reporter satisfaction ratings (1–5 stars) and comments.
9. `notifications`: In-app real-time alerts.
10. `audit_logs`: Administrative security log.

---

## 4. Quick Start & Setup

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+ recommended)
- A Supabase account (free tier)

### Step 1: Clone & Configure Environment
```bash
cp .env.example .env
```
Open `.env` and fill in your Supabase credentials:
```env
PORT=5001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5001/api/v1
```

### Step 2: Apply Supabase Migrations
In your Supabase project SQL Editor, run in order:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_seed_data.sql`

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Run Development Server
```bash
# Runs both backend API (port 5001) and frontend Vite server (port 5173)
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Automated Testing

Run the test suite across both frontend and backend:
```bash
# Run all tests
npm test

# Run backend API tests only (Vitest + Supertest)
npm run test:server

# Run frontend unit tests only (Vitest)
npm run test:client
```

---

## 6. Flagship QR Workflow

1. **Equipment Registration**: An administrator registers an asset (e.g. `SEC-LH101-FAN-01`). The backend generates a secure unguessable QR token.
2. **Label Generation**: The administrator previews and prints the physical sticker.
3. **Scan Landing**: When scanned with a smartphone camera, the browser opens `/equipment/:qrToken`.
4. **Duplicate Prevention**: If an open ticket exists, an active alert is shown to prevent duplicate tickets.
5. **Direct Reporting**: The user selects category, enters problem description, and receives a ticket number (`CMP-YYYYMM-XXXX`).
6. **Resolution & Feedback**: Once repaired by the technician, the reporter receives a notification and submits resolution feedback.
