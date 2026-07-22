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

| # | Domain |
|---|--------|
| 1 | clickmastersdigitalmarketing.com |
| 2 | clickmasterssoftwaredevelopmentcompany.com |
| 3 | clickmastersmobiledevelopmentcompany.com |
| 4 | clickmastersblockchaintechnologies.com |
| 5 | clickmasterswebdevelopmentcompany.com |
| 6 | clickmastersartificialintelligencecompany.com |
| 7 | clickmastersapplicationdevelopment.com |
| 8 | clickmastersaiautomation.com |
| 9 | clickmasterssoftwaredevelopmentcompany.co.uk |
| 10 | clickmastersartificialintelligencecompany.co.uk |

---

# Core Architecture

## Current Stack (Implemented)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) |
| Backend | Next.js API Routes |
| Database | MongoDB + Mongoose |
| Auth | JWT (single admin login) |
| Styling | Tailwind CSS + shadcn/ui |
| Validation | Zod |
| Deployment | Ubuntu, PM2, Nginx |

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

# Authentication

- Only one admin login
- No registration
- No multiple users
- No employee/role management
- JWT-based authentication with 7-day expiry
- Single admin account auto-seeded

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
Table columns: Name, Phone, Email, Website, Service, Source, Status, Created Date, Actions.
Features: Search (name/phone/email/company/message), Pagination, Sorting, Filters (Website, Status, Service, Date).

## Lead Details Page
Displays: Name, Email, Phone, Company, Message, Website, Landing Page, Service, Status, Notes, Created/Updated Date, Referrer, UTM fields (source/medium/campaign/term/content), IP Address, Country, City, Browser, OS, Device Type.
Editable fields only: Status, Notes, Service. Original lead data remains unchanged.

## Services Page
Manage available services (CRUD).

## Websites Page
Manage connected websites (CRUD).

---

# Lead Statuses

| Status | Meaning |
|--------|---------|
| 🟢 New | Fresh lead, not contacted yet |
| 🟡 Contacted | Reached out to |
| 🔵 Closed | Deal won/lost |
| 🔴 Spam | Marked as spam |

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
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/leads` | Create a new lead (from external websites) |
| OPTIONS | `/api/leads` | CORS preflight for external domains |

## Protected (Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | List leads (paginated, filterable, searchable) |
| GET | `/api/leads/stats` | Dashboard statistics |
| GET | `/api/leads/charts` | Chart data |
| GET | `/api/leads/:id` | Get single lead |
| PUT | `/api/leads/:id` | Update lead (status, notes, service only) |
| DELETE | `/api/leads/:id` | Delete a lead |
| GET | `/api/websites` | List websites |
| POST | `/api/websites` | Create website |
| GET | `/api/services` | List services |
| POST | `/api/services` | Create service |
| POST | `/api/auth/login` | Admin login |

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

| Collection | Purpose |
|------------|---------|
| `users` | Single admin account |
| `leads` | All lead submissions from all domains |
| `websites` | Registered ClickMasters websites |
| `services` | Available service categories |

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

- JWT Authentication (Bearer token)
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
| Table | Purpose |
|-------|---------|
| `domains` | Each tracked website/domain |
| `visitors` | Unique visitor identity + returning status |
| `sessions` | Group page views into visits |
| `page_views` | Pages visited + duration |
| `leads` | Expanded: form/whatsapp/call types |
| `ai_query_log` | AI assistant interaction audit log |

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

| Component | Technology |
|-----------|-----------|
| Server | Ubuntu VPS |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| Domain | crm.clickmasters.pk |
| Database | MongoDB (local or Atlas) |

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
