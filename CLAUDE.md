# Lead Management System — Development Guide

## Project Overview
Fullstack Lead Management System built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **MongoDB (Mongoose)**. The application runs both the UI frontend and API backend on a **single port (`3000`)** in a single unified Node process.

For full product context (roles, pages, ERP integration), see **`AGENTS.md`**. For ERP ↔ CRM Project Connectors plan, see **`plan.md`**.

---

## Commands

- **Development**: `npm run dev` (Starts Next.js dev server on port `3000`; DB auto-seeds on connect)
- **Seed Database**: `npm run seed` (Manually seeds admin user, default websites, and services into MongoDB)
- **Build**: `npm run build` (Compiles production build)
- **Start Production**: `npm start` (Runs production Next.js server on port `3000`)
- **Lint**: `npm run lint` (Runs ESLint check)

---

## Directory Structure

```
lead-management/
├── app/                         # Next.js App Router (Pages & Components)
│   ├── (dashboard)/             # Authenticated shell (sidebar + navbar)
│   │   ├── dashboard/           # Analytics & charts
│   │   ├── leads/               # Lead table & details
│   │   ├── websites/            # Website CRUD + health
│   │   ├── services/            # Services
│   │   ├── users/               # Admin user management
│   │   └── integrations/        # Connected Apps (ERP links)
│   ├── api/                     # API Route Handlers (single-port)
│   │   ├── auth/login/route.js  # POST — Login & JWT
│   │   ├── health/route.js      # GET — Health check
│   │   ├── leads/               # CRUD + stats + charts + bulk
│   │   ├── services/route.js
│   │   ├── websites/            # CRUD + stats + connection check
│   │   ├── users/               # Admin user CRUD
│   │   └── integrations/        # ERP authorize proxy, confirm, disconnect
│   ├── connect/authorize/       # ERP consent page (no dashboard chrome)
│   ├── login/                   # Login (?returnTo= supported)
│   └── preview/                 # Email preview
├── lib/
│   ├── db.js                    # Mongoose connection + auto-seed
│   ├── auth.js                  # JWT sign/verify + role guards
│   ├── config.js                # Statuses, roles, integration constants
│   ├── api.js                   # Client-side API fetch wrapper
│   ├── models/
│   │   ├── Lead.js
│   │   ├── User.js
│   │   ├── Website.js
│   │   ├── ConnectedIntegration.js
│   │   └── IntegrationAudit.js
│   └── services/
│       ├── email.js
│       ├── emailTemplates.js
│       ├── erpIntegration.js    # ERP authorize-request + confirm client
│       └── geo.js
├── scripts/seed.js
├── .env                         # Environment configuration (see .env.example)
├── leadcrmplan.md               # CRM-oriented ERP integration plan
├── erpplan.md                   # ERP contract reference
├── AGENTS.md                    # Full product / agent context
└── package.json
```

---

## Environment Configuration (`.env`)

Copy from `.env.example`. Typical keys:

```ini
# Server & Database
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/clickmasters_leads
CLIENT_ORIGIN=http://localhost:3000

# JWT Authentication
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=7d

# Initial Admin User Credentials
ADMIN_EMAIL=admin@clickmasters.com
ADMIN_PASSWORD=change_me

# Frontend API URL (empty string for same-origin single-port requests)
NEXT_PUBLIC_API_URL=

# Email Notifications (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
NOTIFY_TO=

# ERP Project Connectors (Phase 2) — must match ERP
ERP_API_BASE_URL=http://192.168.88.36:3000
INTEGRATION_CONFIRM_SECRET=clickmasters-integration-confirm-dev-change-me
CRM_EXTERNAL_COMPANY_ID=clickmasters-lead-crm
```

> `INTEGRATION_CONFIRM_SECRET` is sent as HTTP header **`X-Integration-Secret`** (that string is not an env var name).

---

## Development Guidelines & Rules

1. **Next.js 16 Async Route Parameters**:
   In App Router dynamic Route Handlers (`app/api/leads/[id]/route.js`), `params` is a Promise and must be awaited:
   ```javascript
   export async function GET(request, { params }) {
     const { id } = await params;
     // ...
   }
   ```

2. **Mongoose Model Hot-Reload Safety**:
   To prevent model compilation errors during dev server hot reloading, define models using fallback logic:
   ```javascript
   const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
   ```

3. **Single-Port Relative API Paths**:
   All client-side API requests in `lib/api.js` use relative path `/api/...` when `NEXT_PUBLIC_API_URL` is empty, avoiding CORS issues.

4. **Automatic Seeding**:
   On `connectDB()`, admin / websites / services are seeded if missing.

5. **ERP integration trust**:
   Never expose `INTEGRATION_CONFIRM_SECRET` to the browser. Consent page only carries `requestId`; confirm runs in CRM API routes via `lib/services/erpIntegration.js`. Inbound ERP calls use `lib/services/integrationAuth.js` (secret + Ed25519).
   Plans: `leadcrmplan.md`, `erpplan.md`.