<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# ClickMasters Central Lead Management System

## Project Overview

A centralized Lead Management System (LMS) for all ClickMasters websites. Every website sends its contact form submissions to a single backend API. The system automatically stores, organizes, and displays all leads in one dashboard.

This is an **internal tool**, NOT a public CRM.

### Priorities

- Simplicity
- Clean architecture
- Fast performance
- Scalability
- Maintainability
- No unnecessary enterprise features

## Primary Goal

Instead of checking multiple websites and multiple emails, every lead should appear in one dashboard.

## ClickMasters Websites (All Connected Domains)

| #  | Domain                                          |
| -- | ----------------------------------------------- |
| 1  | clickmastersdigitalmarketing.com                |
| 2  | clickmasterssoftwaredevelopmentcompany.com      |
| 3  | clickmastersmobiledevelopmentcompany.com        |
| 4  | clickmastersblockchaintechnologies.com          |
| 5  | clickmasterswebdevelopmentcompany.com           |
| 6  | clickmastersartificialintelligencecompany.com   |
| 7  | clickmastersapplicationdevelopment.com          |
| 8  | clickmastersaiautomation.com                    |
| 9  | clickmasterssoftwaredevelopmentcompany.co.uk    |
| 10 | clickmastersartificialintelligencecompany.co.uk |

---

# Core Architecture

## Current Stack (Implemented)

| Layer      | Technology               |
| ---------- | ------------------------ |
| Frontend   | Next.js (App Router)     |
| Backend    | Next.js API Routes       |
| Database   | MongoDB + Mongoose       |
| Auth       | JWT (single admin login) |
| Styling    | Tailwind CSS + shadcn/ui |
| Validation | Zod                      |
| Deployment | Ubuntu, PM2, Nginx       |

## Project Structure

```
lead-management/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/       # Analytics & charts
│   │   ├── leads/           # Lead table & details
│   │   ├── services/        # Manage services
│   │   └── websites/        # Manage websites
│   ├── api/
│   │   ├── auth/            # JWT login
│   │   ├── health/          # Health check
│   │   ├── leads/           # Lead CRUD + stats + charts
│   │   ├── services/        # Service CRUD
│   │   └── websites/        # Website CRUD
│   ├── login/               # Admin login page
│   ├── preview/             # Lead preview/template
│   ├── layout.js
│   ├── globals.css
│   └── page.js              # Landing/redirect
├── components/
│   ├── navbar.jsx
│   ├── sidebar.jsx
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── api.js               # Frontend API client
│   ├── auth.js              # JWT sign/verify
│   ├── config.js            # Constants (statuses, services, websites)
│   ├── db.js                # MongoDB connection
│   ├── utils.js             # Helpers
│   ├── models/
│   │   ├── Lead.js          # Lead schema
│   │   ├── User.js          # Admin user schema
│   │   └── Website.js       # Website schema
│   └── services/
│       ├── email.js         # SMTP email service
│       ├── emailTemplates.js # HTML email templates
│       └── geo.js           # Device/IP detection
├── scripts/
│   └── seed.js              # Auto-seeds admin + defaults
├── AGENTS.md                       # This file — project context for AI agents
├── EXTERNAL-WEBSITES-CONNECTION.md # Guide for connecting external sites
└── package.json
```

---

# Authentication & User Management

- JWT-based authentication with 7-day expiry (role embedded in token)
- No public registration — users are created by an admin on the Users page
- Multiple users supported with roles (see User Roles & Permissions below)
- Deactivated accounts cannot log in; `lastLoginAt` recorded on every login
- Single admin account auto-seeded (`ADMIN_EMAIL`/`ADMIN_PASSWORD`), self-repairs on seed

# User Roles & Permissions

| Role | Label | Capabilities |
| ---- | ----- | ------------ |
| `admin` | Admin | Everything: user management, all CRUD, delete leads, connection checks |
| `manager` | Manager | Work leads, manage services & websites, view dashboard |
| `team_lead` | Team Lead | Work leads, manage services & websites, view dashboard |
| `sales_agent` | Sales Agent | Work leads: update status/notes/service/assignment |
| `viewer` | Viewer | Read-only: view leads and dashboard |

- `WRITE_ROLES` in `lib/config.js` is the single source of truth for "can work leads"
- `lib/auth.js` guards: `requireAuth` (any active user), `requireWrite` (WRITE_ROLES), `requireAdmin`
- User management endpoints are admin-only; Users nav item hidden for non-admins
- Self-guards: cannot demote/deactivate/delete yourself; cannot delete or deactivate the last active admin

---

# Main Pages

## Login

Simple login page with email + password → JWT token stored in localStorage.

## Dashboard

- Total Leads, Today's Leads, This Month count
- Status cards: New, Contacted, Closed, Spam
- Charts: Daily Leads, Website-wise Leads, Service-wise Leads, Monthly Leads
- Recent Leads table

## Leads Page

Table columns: Name, Phone, Email, Website, Service, Source, Status, Assigned To, Created Date, Actions.
Features: Search (name/phone/email/company/message), Pagination, Sorting, Filters (Website, Status, Service, Date, Assignee), row selection with Bulk Actions (status change, assign to user, delete), CSV export, and a TEST badge on connection-check leads (`isTest`).

## Lead Details Page

Displays: Name, Email, Phone, Company, Message, Website, Landing Page, Service, Status, Notes, Created/Updated Date, Referrer, UTM fields (source/medium/campaign/term/content), IP Address, Country, City, Browser, OS, Device Type.
Editable fields only: Status, Notes, Service, Assigned To (team-member dropdown). Original lead data remains unchanged.
Includes an Activity Timeline: every status change, assignment, service change, note addition, and lead creation is logged with actor, role, and timestamp (`activities[]`).

## Services Page

Manage available services (CRUD).

## Websites Page

Manage connected websites (CRUD) plus connection health monitoring:
- Health badges: Connected (real lead ≤7d), Stale (8–30d), Dormant (30d+), Never Connected
- Per-website stats: total leads, leads in last 7 days, last lead time, last check result
- Connection Check: sends a real test lead through the public API, verifies it landed in the database, records latency; emails suppressed, lead flagged `isTest`
- Delete guard: websites with existing leads cannot be deleted (HTTP 409)

## Users Page

Admin-only user management: add, view, edit (name/email/role), activate/deactivate, reset password, and delete users, with self/last-admin guards.

---

# Lead Statuses

| Status       | Meaning                       |
| ------------ | ----------------------------- |
| 🟢 New       | Fresh lead, not contacted yet |
| 🟡 Contacted | Reached out to                |
| 🔵 Closed    | Deal won/lost                 |
| 🔴 Spam      | Marked as spam                |

---

# Services (Default)

1. Software Development
2. Web Development
3. Mobile App Development
4. Artificial Intelligence
5. Blockchain
6. Digital Marketing
7. Automation

---

# API Endpoints

## Public (No Auth Required)

| Method  | Endpoint       | Description                                |
| ------- | -------------- | ------------------------------------------ |
| POST    | `/api/leads` | Create a new lead (from external websites) |
| OPTIONS | `/api/leads` | CORS preflight for external domains        |

## Protected (Auth Required)

| Method | Endpoint              | Description                                    |
| ------ | --------------------- | ---------------------------------------------- |
| GET    | `/api/leads`        | List leads (paginated, filterable, searchable) |
| GET    | `/api/leads/stats`  | Dashboard statistics                           |
| GET    | `/api/leads/charts` | Chart data                                     |
| GET    | `/api/leads/:id`    | Get single lead                                |
| PUT    | `/api/leads/:id`    | Update lead (status, notes, service only)      |
| DELETE | `/api/leads/:id`    | Delete a lead                                  |
| GET    | `/api/websites`       | List websites                                  |
| POST   | `/api/websites`       | Create website                                 |
| PUT    | `/api/websites/:id`   | Update website                                 |
| DELETE | `/api/websites/:id`   | Delete website (409 if leads exist)            |
| GET    | `/api/websites/stats` | Per-website lead stats + connection health     |
| POST   | `/api/websites/check` | Send test lead & verify connection             |
| DELETE | `/api/websites/check` | Remove all test leads                          |
| GET    | `/api/services`       | List services                                  |
| POST   | `/api/services`       | Create service                                 |
| GET    | `/api/users`          | List users + current session info (admin)      |
| POST   | `/api/users`          | Create user (admin)                            |
| GET    | `/api/users/:id`      | Get user (admin)                               |
| PUT    | `/api/users/:id`      | Update user (admin, self/last-admin guarded)   |
| DELETE | `/api/users/:id`      | Delete user (admin, self/last-admin guarded)   |
| POST   | `/api/leads/bulk`     | Bulk status/assign/delete on selected leads    |
| POST   | `/api/auth/login`     | Login (any active user; role returned in JWT)  |

## Lead POST Payload (External Form Submission)

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+44 20 1234 5678",
  "company": "Acme Ltd",
  "website": "clickmasterssoftwaredevelopmentcompany.com",
  "service": "Artificial Intelligence",
  "message": "Need an AI chatbot for our support site.",
  "landingPage": "https://example.com/contact",
  "referrer": "https://google.com/",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "summer_sale",
  "utm_term": "software company",
  "utm_content": "header_button"
}
```

## Automatically Captured Fields

On every lead submission, the backend captures:

- Submission Timestamp (createdAt)
- IP Address
- Country & City (via geo lookup)
- Browser name
- Operating System
- Device Type (desktop/tablet/mobile)
- User Agent string

---

# Email Notifications (SMTP)

When a new lead arrives:

1. **Auto-reply to visitor** — Branded thank-you email confirming receipt.
2. **Team notification** — Alert emailed to `software.clickmasters@gmail.com` with lead details.

Both emails use beautiful HTML templates matching the ClickMasters brand.

---

# CORS & External Access

CORS is fully enabled for all domains:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

External websites can POST leads without any authentication token.

---

# Database Collections

| Collection   | Purpose                               |
| ------------ | ------------------------------------- |
| `users`    | Team accounts with roles (admin-managed) |
| `leads`    | All lead submissions from all domains |
| `websites` | Registered ClickMasters websites      |
| `services` | Available service categories          |

## Lead Schema (Mongoose)

```
{
  name: String (required),
  email: String (required),
  phone: String,
  company: String,
  message: String,
  website: String (required),
  landingPage: String,
  service: String,
  status: String (enum: New/Contacted/Closed/Spam, default: "New"),
  assigneeId: ObjectId (ref: User, nullable),
  assigneeName: String,
  isTest: Boolean (default false — connection-check leads, excluded from stats),
  activities: [{ type, message, actor, actorId, createdAt }],
  source: String,
  referrer: String,
  utm: { source, medium, campaign, term, content },
  ipAddress: String,
  country: String,
  city: String,
  browser: String,
  os: String,
  deviceType: String,
  userAgent: String,
  notes: [{ text: String, createdAt: Date, updatedAt: Date }],
  createdAt: Date,
  updatedAt: Date
}
```

---

# Security

- JWT Authentication (Bearer token, includes user role)
- Role-based endpoint guards (requireAuth / requireWrite / requireAdmin)
- Password hashing (bcrypt)
- Input validation (Zod schemas)
- CORS enabled
- Rate limiting
- MongoDB injection protection
- XSS protection
- Environment variables for all secrets

---

# Performance

- Pagination (server-side)
- Server-side filtering & sorting
- MongoDB indexes on queried fields
- Lean queries for read operations
- Lazy loading, avoid unnecessary re-renders

---

# Advanced Platform Roadmap (Future)

The following features are documented in the system requirements but **not yet implemented** — the architecture supports adding them without major refactoring.

## Multi-Event Tracking

- WhatsApp button clicks
- Phone call clicks (click-to-call)
- Tracked as separate interaction types alongside form submissions

## Duplicate Prevention (Unique Visitor Logic)

- Unique visitor ID via cookie/localStorage + fingerprinting
- Configurable time window (24 hours / session)
- Each interaction type deduplicated independently

## Visitor Behavior & Journey Tracking

- Page-level tracking with timestamps
- Time-on-page calculation
- Visitor journey flow (entry → path → exit)
- Returning visitor detection
- Session grouping

## Embedded AI Assistant

- Natural-language query interface in the dashboard
- Connects directly to live database (read access)
- Example queries: "Show me today's conversion rate", "How many leads this month?"
- Supports contextual follow-up questions
- Proactive insight flagging (traffic spikes, conversion drops)

## Multi-Domain Management (Enhanced)

- Independent tracking data per domain
- Unified overview + per-domain drill-down
- Cross-domain comparison queries via AI assistant

## Suggested Schema (Future Features)

| Table            | Purpose                                    |
| ---------------- | ------------------------------------------ |
| `domains`      | Each tracked website/domain                |
| `visitors`     | Unique visitor identity + returning status |
| `sessions`     | Group page views into visits               |
| `page_views`   | Pages visited + duration                   |
| `leads`        | Expanded: form/whatsapp/call types         |
| `ai_query_log` | AI assistant interaction audit log         |

---

# Coding Standards

- Use async/await, no callbacks
- Proper folder structure
- Reusable components
- Environment variables, never hardcode secrets
- Validate every API request (Zod)
- Proper HTTP status codes
- REST API conventions
- Modern, responsive, clean UI with shadcn/ui
- Loading states, toast notifications, confirmation dialogs

---

# Deployment

| Component       | Technology               |
| --------------- | ------------------------ |
| Server          | Ubuntu VPS               |
| Process Manager | PM2                      |
| Reverse Proxy   | Nginx                    |
| Domain          | crm.clickmasters.pk      |
| Database        | MongoDB (local or Atlas) |

Skip Docker, Kubernetes, Redis, RabbitMQ, complex CI/CD — added only when/if needed.

---

# Environment Variables

```
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=software.clickmasters@gmail.com
SMTP_PASS=cdlrjbifnewlltss
NEXT_PUBLIC_API_URL=
```

---

# Goal

The final product should feel like a lightweight CRM built specifically for ClickMasters. Simple, fast, clean, scalable, easy to maintain. Focus on reliability and excellent user experience.
