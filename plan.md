
Below is a **developer specification** that you can save as **`PLAN.md`**. It is written for an AI coding agent (Cursor, Claude Code, Codex, Gemini CLI, etc.) to follow while building the project.

```md
# ClickMasters Central Lead Management System

## Project Overview

Build a centralized Lead Management System (LMS) for all ClickMasters websites.

Every website should send its contact form submissions to a single backend API.

The system should automatically store, organize, and display all leads in one dashboard.

This is an internal tool, **NOT** a public CRM.

The project should prioritize:

- Simplicity
- Clean architecture
- Fast performance
- Scalability
- Maintainability

Avoid unnecessary enterprise features.

---

# Primary Goal

Instead of checking multiple websites and multiple emails, every lead should appear in one dashboard.

Example websites:

- clickmastersdigitalmarketing.com
- clickmasterssoftwaredevelopmentcompany.com
- clickmastersmobiledevelopmentcompany.com
- clickmastersblockchaintechnologies.com
- clickmasterswebdevelopmentcompany.com
- clickmastersartificialintelligencecompany.com
- clickmastersapplicationdevelopment.com
- clickmastersaiautomation.com
- clickmasterssoftwaredevelopmentcompany.co.uk
- clickmastersartificialintelligencecompany.co.uk

Every website will communicate with one backend API.

---

# Tech Stack

Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend
- Node.js
- Express.js
- TypeScript

Database
- MongoDB
- Mongoose

Authentication
- JWT

Deployment
- Ubuntu
- PM2
- Nginx

---

# Project Structure

/client

/server

---

# Authentication

Only one login is required.

No registration.

No multiple users.

No employee management.

No role management.

Create only one admin account.

---

# Main Pages

## Login

Simple login page.

Email

Password

JWT Authentication.

---

## Dashboard

Display:

- Total Leads
- Today's Leads
- New Leads
- Contacted Leads
- Closed Leads
- Spam Leads

Recent Leads table.

---

## Leads Page

Table columns:

Name

Phone

Email

Website

Service

Source

Status

Created Date

Actions

Features:

Search

Pagination

Sorting

Filters

---

Filters

Website

Status

Service

Date

---

## Lead Details Page

Display complete information.

Name

Email

Phone

Company (optional)

Message

Website

Landing Page

Service

Status

Notes

Created Date

Updated Date

Referrer

UTM Source

UTM Medium

UTM Campaign

UTM Term

UTM Content

IP Address

Country

City

Browser

Operating System

Device Type

---

Allow editing:

Status

Notes

Service

Nothing else.

Original lead data should remain unchanged.

---

# Lead Status

Only use:

New

Contacted

Closed

Spam

---

# Services

Initially:

Software Development

Web Development

Mobile App Development

Artificial Intelligence

Blockchain

Digital Marketing

Automation

---

# Websites

Create a Websites collection.

Each website should have:

Name

Domain

Status

Created Date

Example:

ClickMasters Software UK

clickmasterssoftwaredevelopmentcompany.co.uk

---

# API

Every website will POST to:

/api/leads

Example:

{
"name":"John",
"email":"john@gmail.com",
"phone":"+44xxxx",
"message":"Need AI chatbot",
"website":"clickmasterssoftwaredevelopmentcompany.com",
"service":"Artificial Intelligence",
"landingPage":"https://example.com/contact",
"referrer":"https://google.com/",
"utm_source":"google",
"utm_medium":"cpc",
"utm_campaign":"summer_campaign",
"utm_term":"software company",
"utm_content":"header_button"
}

Backend validates and stores everything.

---

# Automatically Capture

Backend should also capture:

Submission Time

IP Address

Country

City

Browser

Operating System

Device Type

User Agent

---

# Notifications

When a new lead arrives:

Store in MongoDB.

Send email notification.

Refresh dashboard immediately.

---

# Dashboard Analytics

Cards:

Total Leads

Today's Leads

This Month

New

Contacted

Closed

Spam

Charts:

Daily Leads

Website-wise Leads

Service-wise Leads

Monthly Leads

---

# Search

Search by:

Name

Phone

Email

Company

Message

---

# Notes

Each lead should support internal notes.

Notes are private.

Notes should include:

Text

Created Date

Updated Date

---

# Database Collections

users

leads

services

websites

---

# Coding Standards

Use TypeScript everywhere.

Use async/await.

No callback-based code.

Use proper folder structure.

Create reusable components.

Use environment variables.

Never hardcode secrets.

Validate every API request.

Return proper HTTP status codes.

Follow REST API conventions.

---

# UI Requirements

Modern dashboard.

Responsive.

Clean.

Minimal.

Fast.

Use shadcn/ui components.

Use loading states.

Use toast notifications.

Use confirmation dialogs before delete actions.

---

# Security

JWT Authentication

Password hashing

Helmet

Rate limiting

CORS

Input validation

Mongo injection protection

XSS protection

Sanitize user input

---

# Performance

Pagination

Server-side filtering

Indexes in MongoDB

Lazy loading

Avoid unnecessary re-renders

---

# Future Ready

The architecture should allow future additions without major refactoring.

Possible future features:

- WhatsApp Integration
- AI Lead Scoring
- Auto Follow-ups
- File Uploads
- Proposal Generator
- Google Calendar Integration
- Activity Timeline
- CRM Integrations

Do not implement these now.

Only design the architecture so they can be added later.

---

# Goal

The final product should feel like a lightweight CRM built specifically for ClickMasters.

It should be simple, fast, clean, scalable, and easy to maintain.

Do not add unnecessary complexity.

Focus on reliability and excellent user experience.
```

One suggestion I would make before you start coding is to make this a **monorepo** from day one:

```text
clickmasters-leads/
│
├── apps/
│   ├── web/          # Next.js Dashboard
│   └── api/          # Express Backend
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── utils/
│   └── config/
│
├── docker/
├── docs/
├── .env.example
├── package.json
└── README.md
```

This structure will make it much easier to add more websites, integrations, or future mobile apps without reorganizing the project later.



# ClickMasters Central Lead Management System

## Project Overview

Build a centralized Lead Management System (LMS) for all ClickMasters websites.

Every website should send its contact form submissions to a single backend API.

The system should automatically store, organize, and display all leads in one dashboard.

This is an internal tool, **NOT** a public CRM.

The project should prioritize:

- Simplicity
- Clean architecture
- Fast performance
- Scalability
- Maintainability

Avoid unnecessary enterprise features.

---

# Primary Goal

Instead of checking multiple websites and multiple emails, every lead should appear in one dashboard.

Example websites:

- clickmastersdigitalmarketing.com
- clickmasterssoftwaredevelopmentcompany.com
- clickmastersmobiledevelopmentcompany.com
- clickmastersblockchaintechnologies.com
- clickmasterswebdevelopmentcompany.com
- clickmastersartificialintelligencecompany.com
- clickmastersapplicationdevelopment.com
- clickmastersaiautomation.com
- clickmasterssoftwaredevelopmentcompany.co.uk
- clickmastersartificialintelligencecompany.co.uk

Every website will communicate with one backend API.

---

# Tech Stack

Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend

- Node.js
- Express.js
- TypeScript

Database

- MongoDB
- Mongoose

Authentication

- JWT

Deployment

- Ubuntu
- PM2
- Nginx

---

# Project Structure

/client

/server

---

# Authentication

Only one login is required.

No registration.

No multiple users.

No employee management.

No role management.

Create only one admin account.

---

# Main Pages

## Login

Simple login page.

Email

Password

JWT Authentication.

---

## Dashboard

Display:

- Total Leads
- Today's Leads
- New Leads
- Contacted Leads
- Closed Leads
- Spam Leads

Recent Leads table.

---

## Leads Page

Table columns:

Name

Phone

Email

Website

Service

Source

Status

Created Date

Actions

Features:

Search

Pagination

Sorting

Filters

---

Filters

Website

Status

Service

Date

---

## Lead Details Page

Display complete information.

Name

Email

Phone

Company (optional)

Message

Website

Landing Page

Service

Status

Notes

Created Date

Updated Date

Referrer

UTM Source

UTM Medium

UTM Campaign

UTM Term

UTM Content

IP Address

Country

City

Browser

Operating System

Device Type

---

Allow editing:

Status

Notes

Service

Nothing else.

Original lead data should remain unchanged.

---

# Lead Status

Only use:

New

Contacted

Closed

Spam

---

# Services

Initially:

Software Development

Web Development

Mobile App Development

Artificial Intelligence

Blockchain

Digital Marketing

Automation

---

# Websites

Create a Websites collection.

Each website should have:

Name

Domain

Status

Created Date

Example:

ClickMasters Software UK

clickmasterssoftwaredevelopmentcompany.co.uk

---

# API

Every website will POST to:

/api/leads

Example:

{
"name":"John",
"email":"john@gmail.com",
"phone":"+44xxxx",
"message":"Need AI chatbot",
"website":"clickmasterssoftwaredevelopmentcompany.com",
"service":"Artificial Intelligence",
"landingPage":"https://example.com/contact",
"referrer":"https://google.com/",
"utm_source":"google",
"utm_medium":"cpc",
"utm_campaign":"summer_campaign",
"utm_term":"software company",
"utm_content":"header_button"
}

Backend validates and stores everything.

---

# Automatically Capture

Backend should also capture:

Submission Time

IP Address

Country

City

Browser

Operating System

Device Type

User Agent

---

# Notifications

When a new lead arrives:

Store in MongoDB.

Send email notification.

Refresh dashboard immediately.

---

# Dashboard Analytics

Cards:

Total Leads

Today's Leads

This Month

New

Contacted

Closed

Spam

Charts:

Daily Leads

Website-wise Leads

Service-wise Leads

Monthly Leads

---

# Search

Search by:

Name

Phone

Email

Company

Message

---

# Notes

Each lead should support internal notes.

Notes are private.

Notes should include:

Text

Created Date

Updated Date

---

# Database Collections

users

leads

services

websites

---

# Coding Standards

Use TypeScript everywhere.

Use async/await.

No callback-based code.

Use proper folder structure.

Create reusable components.

Use environment variables.

Never hardcode secrets.

Validate every API request.

Return proper HTTP status codes.

Follow REST API conventions.

---

# UI Requirements

Modern dashboard.

Responsive.

Clean.

Minimal.

Fast.

Use shadcn/ui components.

Use loading states.

Use toast notifications.

Use confirmation dialogs before delete actions.

---

# Security

JWT Authentication

Password hashing

Helmet

Rate limiting

CORS

Input validation

Mongo injection protection

XSS protection

Sanitize user input

---

# Performance

Pagination

Server-side filtering

Indexes in MongoDB

Lazy loading

Avoid unnecessary re-renders

---

# Future Ready

The architecture should allow future additions without major refactoring.

Possible future features:

- WhatsApp Integration
- AI Lead Scoring
- Auto Follow-ups
- File Uploads
- Proposal Generator
- Google Calendar Integration
- Activity Timeline
- CRM Integrations

Do not implement these now.

Only design the architecture so they can be added later.

---

# Goal

The final product should feel like a lightweight CRM built specifically for ClickMasters.

It should be simple, fast, clean, scalable, and easy to maintain.

Do not add unnecessary complexity.

Focus on reliability and excellent user experience.





I agree. Since this is an **internal tool for your own company**, don't over-engineer it. Start with the smallest system that solves your problem.

## MVP (Version 1)

### Dashboard

* Total Leads
* New Leads
* Contacted Leads
* Closed Leads

---

### Lead Table

| Name | Phone | Email | Website | Service | Source | Status | Date |
| ---- | ----- | ----- | ------- | ------- | ------ | ------ | ---- |

Search + Filters:

* Website
* Status
* Date

---

### Lead Details

When you click a lead:

* Name
* Email
* Phone
* Company (optional)
* Message
* Website (which site it came from)
* Landing Page URL
* Service
* UTM Source
* UTM Campaign
* IP/Country (optional)
* Date & Time
* Status
* Notes

---

### Status

Keep only these:

* 🟢 New
* 🟡 Contacted
* 🔵 Closed
* 🔴 Spam

---

### Websites

Store the source website automatically, for example:

* clickmastersdigitalmarketing.com
* clickmasterssoftwaredevelopmentcompany.com
* clickmastersmobiledevelopmentcompany.com
* clickmastersblockchaintechnologies.com
* clickmasterswebdevelopmentcompany.com
* clickmastersartificialintelligencecompany.com
* clickmastersapplicationdevelopment.com
* clickmastersaiautomation.com
* clickmasterssoftwaredevelopmentcompany.co.uk
* clickmastersartificialintelligencecompany.co.uk

---

### Track Where the Lead Came From

Capture automatically:

* Website
* Landing Page URL
* Referrer
* UTM Source
* UTM Medium
* UTM Campaign
* Google/Facebook/Direct/Organic

---

### Notifications

When a new lead arrives:

* Save it in the database.
* Send an email notification.
* Show it instantly on the dashboard.

---

### Simple Settings

Just one page to manage:

* Websites
* Services (AI, Web, Mobile, SEO, etc.)

No employee management, no permissions, no complex roles.

---

## Tech Stack

* **Frontend:** Next.js + Tailwind CSS
* **Backend:** Node.js + Express
* **Database:** MongoDB
* **Authentication:** One admin login (JWT)

---

## Database Collections

Only keep what you need:

* `users` (only your admin account)
* `leads`
* `websites`
* `services`

---

This MVP can realistically be built in **5–7 days** and will already give you a centralized system where **every website sends its leads to one dashboard**, which sounds like your primary goal. Once you're using it daily, you'll naturally discover which additional features are actually worth building instead of adding complexity upfront.




I agree. For your use case, **Docker is unnecessary**.

You're already comfortable with:

* Ubuntu VPS
* PM2
* Nginx
* Node.js
* MongoDB

Docker would just add another layer to maintain without providing much benefit for a single internal application.

I'd simplify the structure even further:

```text
clickmasters-leads/
│
├── client/                 # Next.js Dashboard
│
├── server/                 # Express API
│
├── docs/
│   └── PLAN.md
│
├── .gitignore
├── README.md
└── package.json
```

Or, if you want a slightly more scalable structure:

```text
clickmasters-leads/
│
├── apps/
│   ├── dashboard/          # Next.js
│   └── api/                # Express
│
├── docs/
│   └── PLAN.md
│
├── package.json
└── README.md
```

I actually prefer the second (`apps/`) structure because if, in the future, you build:

* a mobile app,
* a browser extension,
* a client portal,
* or an admin panel,

you can simply add:

```text
apps/
    dashboard/
    api/
    mobile/
    extension/
```

without restructuring the repository.

### My recommendation

Keep it simple:

* ✅ Next.js Dashboard
* ✅ Express API
* ✅ MongoDB
* ✅ PM2
* ✅ Nginx
* ✅ Ubuntu VPS
* ✅ GitHub

Skip for now:

* ❌ Docker
* ❌ Kubernetes
* ❌ Microservices
* ❌ Redis (unless you later need caching or queues)
* ❌ RabbitMQ/Kafka
* ❌ Complex CI/CD pipelines (a simple GitHub Actions deployment is enough if you want automation)

Since this is an **internal tool for ClickMasters**, the goal should be **fast, reliable, and easy to maintain**, not enterprise complexity. You can always introduce technologies like Docker later if your deployment or scaling needs change.
