# Lead Management System — Development Guide

## Project Overview
Fullstack Lead Management System built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **MongoDB (Mongoose)**. The application runs both the UI frontend and API backend on a **single port (`3000`)** in a single unified Node process.

---

## Commands

- **Development**: `npm run dev` (Runs database seed script `node scripts/seed.js` and starts Next.js dev server on port `3000`)
- **Seed Database**: `npm run seed` (Manually seeds admin user, default websites, and services into MongoDB)
- **Build**: `npm run build` (Compiles production build)
- **Start Production**: `npm start` (Runs production Next.js server on port `3000`)
- **Lint**: `npm run lint` (Runs ESLint check)

---

## Directory Structure

```
lead-management/
├── app/                         # Next.js App Router (Pages & Components)
│   ├── api/                     # API Route Handlers (Single-port HTTP Endpoints)
│   │   ├── auth/login/route.js  # POST — Admin login & JWT token generation
│   │   ├── health/route.js      # GET — Health check
│   │   ├── leads/
│   │   │   ├── route.js         # GET (Filter/Search/Pagination) & POST (Create Lead)
│   │   │   ├── [id]/route.js    # GET, PUT, DELETE lead by ID
│   │   │   ├── stats/route.js   # GET — Dashboard status metrics
│   │   │   └── charts/route.js  # GET — Daily & category analytics
│   │   ├── services/route.js    # GET — Services list
│   │   └── websites/route.js    # GET — Websites list
│   ├── dashboard/               # Main dashboard UI
│   ├── leads/                   # Lead details & listing views
│   └── login/                   # Admin login page
├── lib/                         # Shared utilities, backend models & services
│   ├── db.js                    # Mongoose connection manager & auto-seed runner
│   ├── auth.js                  # JWT token signing & request verification
│   ├── config.js                # System constants (statuses, services, websites)
│   ├── api.js                   # Client-side API fetch wrapper
│   ├── models/                  # Mongoose data schemas
│   │   ├── Lead.js              # Lead model with indexing & text search
│   │   ├── User.js              # Admin user model & bcrypt password comparison
│   │   └── Website.js           # Website & Service models
│   └── services/                # Business logic services
│       ├── email.js             # Nodemailer lead notification handler
│       ├── emailTemplates.js    # HTML/Text email templates for visitor & team
│       └── geo.js               # Device, browser, IP & OS detection
├── scripts/
│   └── seed.js                  # Standalone CLI database seed script
├── .env.local                   # Environment configuration variables
└── package.json
```

---

## Environment Configuration (.env.local)

Environment variables are stored in `.env.local` at the root:

```ini
# Server & Database
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/clickmasters_leads

# JWT Authentication
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=7d

# Initial Admin User Credentials
ADMIN_EMAIL=admin@clickmasters.com
ADMIN_PASSWORD=1234

# Frontend API URL (empty string for same-origin single-port requests)
NEXT_PUBLIC_API_URL=

# Email Notifications (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=software.clickmasters@gmail.com
SMTP_PASS=cdlrjbifnewlltss
SMTP_FROM=software.clickmasters@gmail.com
NOTIFY_TO=software.clickmasters@gmail.com
```

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
   The `npm run dev` script runs `node scripts/seed.js` before starting `next dev`, ensuring admin, website, and service records exist in MongoDB.
