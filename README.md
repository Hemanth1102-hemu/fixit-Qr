# FixIt QR — Smart Campus Maintenance System (SRMIST)

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tests-56%20Passing-brightgreen.svg)](https://vitest.dev/)

An enterprise-grade, academic campus facility maintenance platform engineered for **SRM Institute of Science and Technology (SRMIST)**. **FixIt QR** bridges the physical-digital divide by placing durable QR codes on classroom and laboratory infrastructure (fans, projectors, air conditioners, digital podiums, and switchboards), enabling instant issue logging, automated role routing, real-time technician dispatch, and supervisor verification.

---

## Table of Contents

1. [Key Capabilities & Highlights](#1-key-capabilities--highlights)
2. [5 Dedicated Campus Portals](#2-5-dedicated-campus-portals)
3. [System Architecture](#3-system-architecture)
4. [Database Architecture & 13 Tables](#4-database-architecture--13-tables)
5. [SQL Migrations (001–006)](#5-sql-migrations-001006)
6. [Supervisor Executive Suite (12 Pages)](#6-supervisor-executive-suite-12-pages)
7. [Flagship QR Workflow & 5 Test QRs](#7-flagship-qr-workflow--5-test-qrs)
8. [Institutional Security & SRMIST Identity](#8-institutional-security--srmist-identity)
9. [Setup & Quick Start](#9-setup--quick-start)
10. [API Endpoint Reference](#10-api-endpoint-reference)
11. [Automated Testing Suite (56 Tests)](#11-automated-testing-suite-56-tests)

---

## 1. Key Capabilities & Highlights

* **Automatic Role Recognition & Seamless Redirection**: A unified single login (`/login`) automatically recognizes the user's verified identity, retrieves their trusted role from PostgreSQL, and routes them directly to their dedicated dashboard without manual role selection.
* **Camera-Based Optical QR Scanning**: Built-in browser camera scanner (`html5-qrcode`) with rear-camera autofocus, permission guardrails, and instant identification of campus assets.
* **SRMIST Domain Enforcement**: Enforces `@srmist.edu.in` verified account governance with strict server-side protection against unauthorized email domains and role self-elevation.
* **Extended Ticket Lifecycle**: Complete workflow: `Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Assigned` $\rightarrow$ `In Progress` $\rightarrow$ `Completion Submitted` $\rightarrow$ `Resolved` (with supervisor audit, reopening, rejection, and cancellation handling).
* **SRMIST Classroom Timetable Integration**: Read-only institutional adapter displaying current classroom allocations, session types, and pre-filling equipment reports.
* **Repeat Failure Detection**: Analytics module flagging recurring equipment breakdowns to trigger preventative maintenance.
* **Strict Empty States**: No fabricated demo metrics or fake data fallbacks; displays honest zero-counts and informative empty states when tables are unpopulated.

---

## 2. 5 Dedicated Campus Portals

```
                       ┌───────────────────────┐
                       │   Unified Login       │
                       │    @srmist.edu.in     │
                       └───────────┬───────────┘
                                   │
       ┌──────────────┬────────────┼─────────────┬──────────────┐
       ▼              ▼            ▼             ▼              ▼
┌──────────────┐┌───────────┐┌───────────┐┌─────────────┐┌────────────┐
│   Student    ││  Faculty  ││Maintenance││ Maintenance ││ Supervisor │
│  Dashboard   ││ Dashboard ││   Staff   ││    Admin    ││ Dashboard  │
└──────────────┘└───────────┘└───────────┘└─────────────┘└────────────┘
```

1. **Student Portal** (`/student/dashboard`)
   * Scan physical equipment QR codes via device camera.
   * View live room schedule and suggested room equipment.
   * Track complaint timeline with real-time status badges.
   * Provide 1–5 star resolution feedback or reopen unsatisfactory repairs.

2. **Faculty Portal** (`/faculty/dashboard`)
   * High-priority classroom problem reporting.
   * View assigned lecture hall / lab allocation details.
   * Track departmental asset repairs with technician contact visibility.

3. **Maintenance Staff Portal** (`/maintenance/dashboard`)
   * Active work order dispatch queue with location details (Building, Room, Floor).
   * Status progression (`in_progress` $\rightarrow$ `completion_submitted`).
   * Enter technical repair notes, parts replaced, and upload completion photo evidence.

4. **Maintenance Admin Portal** (`/maintenance-admin/dashboard`)
   * Central complaint triage queue with status & priority filters.
   * Technician dispatch modal (assign jobs with operational notes).
   * Campus building and room directory management.
   * Equipment inventory registration and print-ready QR sticker generation.
   * Repeat equipment breakdown tracking.

5. **Supervisor Portal** (`/supervisor/dashboard`)
   * Executive 12-page operations suite for facilities monitoring, SLA management, and compliance.
   * Mandatory two-stage quality review for technician work orders.
   * Urgent escalations management and deadline adjustment tracking.
   * Reliability analytics and asset health monitoring.

---

## 3. System Architecture

```
fixit-qr/
├── client/                           # React 18 + Vite Frontend
│   ├── public/
│   │   └── qr-codes/                 # Generated PNG, SVG, and HTML test QR stickers
│   ├── src/
│   │   ├── components/               # Navbar, Sidebar, Badges, EmptyState, SupervisorHeader
│   │   ├── constants/                # Client routes & role mappings
│   │   ├── context/                  # AuthContext (Supabase Auth & Session state)
│   │   ├── lib/                      # Scoped API client with automatic token attachment
│   │   ├── pages/                    # Role dashboards, QR landing, ReportProblem, QrTestSheet
│   │   │   └── supervisor/           # Dedicated 12-page supervisor suite
│   │   ├── App.jsx                   # Protected role-based route switchboard
│   │   └── index.css                 # Campus design system
│   └── vite.config.js                # Vite build config & proxy
│
├── server/                           # Node.js + Express REST API
│   ├── scripts/
│   │   └── generate_qr_codes.js      # Generator script for test QR PNG/SVG assets
│   ├── src/
│   │   ├── constants/                # ROLES, ROLE_PERMISSIONS, ROLE_DESTINATIONS
│   │   ├── lib/                      # Supabase client & authenticated user client factory
│   │   ├── middleware/               # Bearer auth, SRMIST domain check, RBAC guards
│   │   ├── routes/                   # auth, equipment, complaints, admin, supervisor, classroom
│   │   ├── services/                 # SRMIST classroom schedule adapter
│   │   └── app.js                    # Express application setup
│   └── test/                         # Vitest + Supertest integration test suite
│
├── supabase/
│   └── migrations/                   # 6 Safe, version-controlled SQL migrations
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_seed_data.sql
│       ├── 004_supervisor_and_maintenance_roles.sql
│       ├── 005_user_roles_repair_records_and_storage.sql
│       └── 006_supervisor_policies_and_escalations.sql
│
├── .env.example                      # Environment variables template
└── package.json                      # Monorepo workspaces orchestrator
```

---

## 4. Database Architecture & 13 Tables

The application is backed by Supabase PostgreSQL with Row Level Security (RLS) on every table:

| # | Table | Purpose | Relationships |
|---|---|---|---|
| 1 | **`profiles`** | Application identity extending `auth.users`. | `id` $\rightarrow$ `auth.users.id` (1:1) |
| 2 | **`user_roles`** | Dedicated governance table for trusted role assignments. | `user_id` $\rightarrow$ `profiles.id`, `assigned_by` $\rightarrow$ `profiles.id` |
| 3 | **`buildings`** | Physical campus facility records (e.g. Tech Park, University Building). | Contains multiple `rooms` |
| 4 | **`rooms`** | Classrooms, lecture halls, and laboratories. | `building_id` $\rightarrow$ `buildings.id` |
| 5 | **`equipment`** | Fixed campus assets with unguessable `qr_token` values. | `room_id` $\rightarrow$ `rooms.id` |
| 6 | **`complaints`** | Problem incident tickets (`CMP-YYYYMM-XXXX`) with SLA deadline and escalation fields. | `equipment_id` $\rightarrow$ `equipment.id`, `reported_by` $\rightarrow$ `profiles.id` |
| 7 | **`complaint_assignments`** | Technician dispatch log with 1-active-tech partial unique index. | `complaint_id` $\rightarrow$ `complaints.id`, `technician_id` $\rightarrow$ `profiles.id` |
| 8 | **`complaint_status_history`** | Immutable lifecycle transition log. | `complaint_id` $\rightarrow$ `complaints.id`, `changed_by` $\rightarrow$ `profiles.id` |
| 9 | **`repair_records`** | Technician maintenance log (parts, labor hours, costs, sign-offs). | `complaint_id` $\rightarrow$ `complaints.id`, `technician_id` $\rightarrow$ `profiles.id` |
| 10 | **`complaint_feedback`** | Reporter satisfaction star rating (1–5) and comments. | `complaint_id` $\rightarrow$ `complaints.id` (UNIQUE) |
| 11 | **`notifications`** | In-app user notifications for status transitions. | `recipient_id` $\rightarrow$ `profiles.id` |
| 12 | **`audit_logs`** | Security audit trail for high-privilege operations. | `actor_id` $\rightarrow$ `profiles.id` |
| 13 | **`maintenance_policies`** | Configurable SLA response/resolution targets and verification thresholds. | `updated_by` $\rightarrow$ `profiles.id` |

### Storage Buckets & Policies
* **`complaint-photos`**: Authenticated students/faculty upload JPG/PNG photos when lodging tickets.
* **`repair-photos`**: Authenticated technicians upload completion proof for supervisor verification.
* **Public Read**: Verified campus users can view attached evidence photos.

---

## 5. SQL Migrations (001–006)

All migration files are located in `supabase/migrations/`:

1. **`001_initial_schema.sql`**: Creates initial 10 core tables, foreign keys, constraints, and automated `updated_at` triggers.
2. **`002_rls_policies.sql`**: Enables Row Level Security on all tables and creates security definer helper `current_user_role()`.
3. **`003_seed_data.sql`**: Seeds fictional campus blocks (Tech Park, University Building, Bio Tech Block, Tech Park 2) and equipment with `ON CONFLICT DO UPDATE`.
4. **`004_supervisor_and_maintenance_roles.sql`**: Expands roles to include `supervisor` and `maintenance_admin`, adds review lifecycle constraints, and updates supervisor RLS.
5. **`005_user_roles_repair_records_and_storage.sql`**: Creates `user_roles` and `repair_records` tables, creates the `auth.users` new registration trigger, and provisions storage buckets.
6. **`006_supervisor_policies_and_escalations.sql`**: Adds `target_completion_at` and escalation fields to `complaints`, creates `maintenance_policies` table for configurable SLA thresholds, and provisions supervisor RLS.

---

## 6. Supervisor Executive Suite (12 Pages)

Authenticated supervisors are automatically routed to `/supervisor/dashboard` and have exclusive access to:

| Page | Route | Description |
|---|---|---|
| **1. Overview** | `/supervisor/dashboard` | Real database KPI cards, critical incident queue, technician workload summary, monthly trend distributions. |
| **2. All Complaints** | `/supervisor/complaints` | Campus-wide complaint browser with search, multi-faceted filtering, sorting, pagination, and detail inspection modal. |
| **3. Urgent & Escalations** | `/supervisor/escalations` | SLA response breaches, overdue repairs, deadline adjustment dialog with mandatory reason, and admin action triggers. |
| **4. Team Performance** | `/supervisor/team-performance` | Workload distribution, active vs completed jobs, and average resolution times. |
| **5. Completion Review** | `/supervisor/completion-review` | Technician verification queue. Inspect work notes, photos, parts logs. Approve or return for rework with required reason. |
| **6. Analytics & Reports** | `/supervisor/analytics` | Resolution rate, MTTR, breakdowns by building/category, and one-click CSV report export. |
| **7. Equipment Health** | `/supervisor/equipment-health` | Chronic asset failure tracking, repeat breakdowns in 60 days, MTBF (mean time between failures) indicators. |
| **8. Campus Locations** | `/supervisor/locations` | Building and classroom monitoring, equipment inventory count, and active issue counts per classroom block. |
| **9. Audit History** | `/supervisor/audit-logs` | Immutable audit log of all supervisor approvals, reworks, deadline extensions, role changes, and policy modifications. |
| **10. Notifications** | `/supervisor/notifications` | Live operational alerts with read/unread tracking and direct ticket links. |
| **11. Supervisor Profile** | `/supervisor/profile` | Institutional account details, notification preferences, and secure sign-out. |
| **12. Policy Settings** | `/supervisor/policies` | Operational SLA thresholds (response target, resolution hours by priority), review requirement toggle, auto-escalation flag. |

---

## 7. Flagship QR Workflow & 5 Test QRs

FixIt QR provides 5 pre-configured QR codes matching real campus locations:

| # | Asset Code | Equipment Description | Location | QR Token |
|---|---|---|---|---|
| 1 | `TP-101-FAN-01` | Ceiling Fan - Unit A | Tech Park, Floor 1, Room 101 | `tech-park-room-101-fan-01` |
| 2 | `TP-204-PRJ-01` | 4K Laser Ceiling Projector | Tech Park, Floor 2, Room 204 | `tech-park-room-204-projector` |
| 3 | `UB-302-AC-01` | 2.5 Ton Cassette Split AC | University Building, Floor 3, Room 302 | `univ-bldg-room-302-ac` |
| 4 | `BT-105-SBD-01` | Interactive Smartboard | Bio Tech Block, Floor 1, Room 105 | `biotech-room-105-smartboard` |
| 5 | `TP2-401-SWB-01` | Master Electrical Switchboard | Tech Park 2, Floor 4, Room 401 | `tech-park-2-room-401-switchboard` |

Access the interactive printable test sheet at `http://localhost:5173/qr-test`.

---

## 8. Institutional Security & SRMIST Identity

* **Strict Domain Validation**: Validates that users register with official `@srmist.edu.in` accounts. Non-institutional emails are rejected at registration with HTTP 400.
* **Anti-Privilege Escalation**: Non-administrative users cannot assign themselves privileged roles (`technician`, `maintenance_admin`, `supervisor`).
* **Cryptographic Token Verification**: Optical QR scanning validates cryptographic unguessable tokens (`qr_token`), preventing unauthorized complaint injection.

---

## 9. Setup & Quick Start

### Prerequisites
* Node.js v18.0.0 or higher
* npm v9.0.0 or higher
* Supabase Project credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/Hemanth1102-hemu/fixit-Qr.git
cd fixit-Qr

# Install dependencies across monorepo workspaces
npm install
```

### Environment Variables
Configure `.env` in the root directory:

```env
PORT=5001
NODE_ENV=development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ALLOW_NON_SRMIST_EMAILS=true
```

### Run Locally
```bash
npm run dev
```

* **Client**: `http://localhost:5173`
* **API Server**: `http://localhost:5001`
* **API Health**: `http://localhost:5001/api/v1/health`

---

## 10. API Endpoint Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | System health check & database connection status |
| `GET` | `/api/v1/me` | Authenticated | Retrieves verified identity, profile, and roles |
| `POST` | `/api/v1/me/register` | Public | Registers new SRMIST institutional account |
| `GET` | `/api/v1/equipment/qr/:token` | Public / Auth | Resolves equipment asset details by QR token |
| `GET` | `/api/v1/supervisor/overview` | Supervisor | Campus operational metrics & distributions |
| `GET` | `/api/v1/supervisor/complaints` | Supervisor | Campus-wide complaint browser with filters |
| `GET` | `/api/v1/supervisor/escalations` | Supervisor | SLA breach & urgent escalation queue |
| `POST` | `/api/v1/supervisor/escalations/:id/action` | Supervisor | Records escalation action with audit reason |
| `GET` | `/api/v1/supervisor/team-performance` | Supervisor | Technician workload and resolution metrics |
| `GET` | `/api/v1/supervisor/completion-reviews` | Supervisor | Work order verification queue |
| `POST` | `/api/v1/supervisor/completion-reviews/:id/decision` | Supervisor | Approves or returns repair for rework |
| `GET` | `/api/v1/supervisor/analytics` | Supervisor | Operational intelligence & CSV export |
| `GET` | `/api/v1/supervisor/equipment-health` | Supervisor | Repeat failure & asset reliability report |
| `GET` | `/api/v1/supervisor/locations` | Supervisor | Campus facilities & classroom monitoring |
| `GET` | `/api/v1/supervisor/audit-logs` | Supervisor | Immutable administrative audit log |
| `GET` | `/api/v1/supervisor/policies` | Supervisor | Reads operational SLA policies |
| `PUT` | `/api/v1/supervisor/policies` | Supervisor | Updates campus maintenance SLA targets |

---

## 11. Automated Testing Suite (56 Tests)

Execute the complete test suite:

```bash
# Run both client and server test suites
npm test

# Run backend tests only
npm run test --workspace=server

# Run frontend tests only
npm run test --workspace=client
```

### Test Coverage Summary:
* **`server/test/supervisor.test.js`** (14 tests): Strict 401 unauthenticated rejections, legacy aliases.
* **`server/test/database_security_and_roles.test.js`** (15 tests): Domain acceptance, role governance, RLS boundaries.
* **`server/test/roles_and_workflow.test.js`** (13 tests): Lifecycle transitions, auth guards, permissions.
* **`server/test/srmist.test.js`** (10 tests): Domain parsing, anti-self-elevation, timetable adapter.
* **`server/test/health.test.js`** (4 tests): Health check, error handling, CORS.
* **`client/test/components.test.jsx`** (9 tests): StatusBadge, PriorityBadge, StatCard, role destinations.

**Results**: All **56/56 tests passing** with 0 errors.

---

## License

Developed for SRM Institute of Science and Technology. All rights reserved.
