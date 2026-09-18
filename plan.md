# ClickMasters Integration Plan

**Systems:** [erp.clickmasters.pk](https://erp.clickmasters.pk) · [crm.clickmasters.pk](https://crm.clickmasters.pk) · [alphamonitoring.clickmasters.pk](https://alphamonitoring.clickmasters.pk)

**Goal:** Company admins connect external apps from ERP with explicit consent on the target app. Trust is server-to-server — not `JWT → localStorage → getMe()`.

**Principle:** *The browser transports the authorization transaction. The browser is not the source of trust.*

---

## 0. Progress snapshot (read this first when switching projects)

| Phase | Status | Where |
| --- | --- | --- |
| **0** UI shell (Project Connectors page) | ✅ Done | ERP frontend |
| **1** ERP connection core (models + APIs + UI wired) | ✅ Done | ERP backend + frontend |
| **2** CRM authorize + consent + confirm | ✅ Done | **CRM project** (`crm.clickmasters.pk`) |
| **3** Scoped APIs + Web Leads via integration | Pending | ERP + CRM |
| **4** Alpha AI Tracker (same pattern) | Pending | Alpha + ERP |
| **5** Harden / ops | Pending | Both |

### What works today (ERP + CRM Phase 2)

1. Admin opens **Configurations → Project Connectors** (`/admin/project-connectors`).
2. Clicks **Connect** on Lead CRM → ERP creates a one-time `IntegrationAuthorizationRequest` and opens:
   `https://crm.clickmasters.pk/connect/authorize?request=<requestId>&target=lead-crm`
3. CRM shows consent (login + `returnTo` if needed) → **Authorize** creates `ConnectedIntegration` and calls ERP `POST /integrations/confirm`.
4. After successful confirm, ERP shows **Connected**. CRM **Connected Apps** (`/integrations`) lists the link; **Disconnect** revokes on CRM (ERP notify = Phase 5).

### What does NOT work yet

- Web Leads still uses a temporary hard-coded CRM JWT (not integration credentials) — Phase 3.
- Disconnect is CRM-local only (ERP not notified yet) — Phase 5.
- Scoped CRM APIs enforcing `externalCompanyId` — Phase 3.

---

### 0.1 ERP files that matter (Phase 1)

| File | Does what |
| --- | --- |
| `backend/models/company/integrationConnection.model.js` | Durable link per company + target; public key stored; private key encrypted (`select: false`) |
| `backend/models/company/integrationAuthorizationRequest.model.js` | Short-lived one-time request (`requestId`, `jti`, ~60s TTL) |
| `backend/utils/integrationCrypto.utils.js` | Ed25519 keygen + AES-GCM encrypt/decrypt private key |
| `backend/controllers/integration.controller.js` | list / connect / authorize-request lookup / confirm / disconnect |
| `backend/routes/integration.route.js` | Mounted at `/integrations` |
| `frontend/.../ProjectConfiguration.jsx` | Connectors UI calling real APIs |
| `frontend/src/utils/modulesList.js` | Feature `projectsconfiguration` → `/project-connectors` |
| `backend/.env` | `INTEGRATION_CONFIRM_SECRET`, `LEAD_CRM_AUTHORIZE_URL`, `INTEGRATION_AUTH_TTL_SECONDS`, … |

---

### 0.2 How to test Phase 1 confirm (Postman) — common mistakes

**Correct confirm request:**

```http
POST http://<ERP_API_HOST>:3000/integrations/confirm
Content-Type: application/json
X-Integration-Secret: clickmasters-integration-confirm-dev-change-me

{
  "requestId": "8d43fdca8cf5370f7c0264488a28b71e0f14524ab495925f"
}
```

| Wrong (causes errors) | Right |
| --- | --- |
| Body `{ "request": "https://crm.../authorize?request=...&target=lead-crm" }` | Body `{ "requestId": "<opaque hex only>" }` |
| Missing `X-Integration-Secret` header → **401** `"Unauthorized integration confirm"` | Header value = `INTEGRATION_CONFIRM_SECRET` from ERP `.env` |
| Using ERP user JWT instead of integration secret | Confirm is **server-to-server**, not user JWT |
| Confirm after ~60s | Request expires → create a new Connect from ERP UI |

**Optional fields on confirm (CRM will send later):**

```json
{
  "requestId": "...",
  "jti": "...",
  "externalConnectionId": "crm-connection-mongo-id",
  "externalCompanyId": "crm-company-id",
  "connectedByExternalUserId": "crm-user-id"
}
```

**Fetch consent metadata (what CRM will call in Phase 2):**

```http
GET http://<ERP_API_HOST>:3000/integrations/authorize-request/<requestId>
```

Returns company name, requester, scopes, `publicKey`, `keyId`, `expiresAt`, issuer/audience.

---

### 0.3 Shared secrets / env contract (ERP ↔ CRM)

| Name | Lives on | Used for |
| --- | --- | --- |
| `INTEGRATION_CONFIRM_SECRET` | ERP `.env` (and same value on CRM as outbound secret) | CRM → `POST {ERP}/integrations/confirm` header `X-Integration-Secret` |
| `LEAD_CRM_AUTHORIZE_URL` | ERP | Base URL opened on Connect (default `https://crm.clickmasters.pk/connect/authorize`) |
| `INTEGRATION_AUTH_TTL_SECONDS` | ERP | Default `60` |
| `ERP_API_BASE_URL` | **CRM** `.env` | e.g. `https://apierp.clickmasters.pk` or local `http://192.168.88.36:3000` |

> Do **not** put `X-Integration-Secret` as an env *variable name*. That string is an **HTTP header**. The env var is `INTEGRATION_CONFIRM_SECRET`.

---

## 1. Purpose (Why)

| Why | Detail |
| --- | --- |
| One control plane | ERP manages which external products a company links |
| Explicit consent | Human must Authorize on CRM/Alpha |
| Real trust | Servers confirm; browser only carries opaque `requestId` |
| Reusable | Same design for Alpha, later HR / Inventory / Accounting |
| Security | No auth/session JWT in `localStorage` as the integration trust model |

---

## 2. Target architecture

```text
     erp.clickmasters.pk                    crm.clickmasters.pk
     ┌─────────────────┐                    ┌─────────────────┐
     │ Project Connectors                  │ /connect/authorize
     │ /integrations/* │                    │ ConnectedIntegration
     └────────┬────────┘                    └────────┬────────┘
              │ 1. POST .../lead-crm/connect         │
              │ 2. redirect ?request=<id> ──────────►│
              │                         3. CRM login │
              │                         4. consent UI│
              │                         5. Authorize │
              │◄── 6. POST /integrations/confirm ────┤
              │    header X-Integration-Secret       │
              │ 7. status=active                     │
              │◄── 8. future scoped APIs ────────────┤
```

### Four trust layers (do not collapse into one JWT)

| Layer | Question | Mechanism |
| --- | --- | --- |
| User auth | Who is this human? | CRM **HttpOnly Secure** session cookie |
| User authorization | Did they approve ERP? | One-time `requestId` / `jti` (~60s) |
| App identity | Is this really our ERP? | Ed25519 **public key** on CRM; private key only on ERP |
| API authorization | What may ERP do? | Scopes e.g. `crm.leads.read` |

---

## 3. Data model

### ERP (implemented)

**`IntegrationConnection`** — one per `(companyId, targetSystem)`  
`status`: `pending` | `active` | `revoked`  
`publicKey`, `privateKeyEncrypted`, `keyId`, `certificateFingerprint`, `scopes[]`, `connectedAt`, `revokedAt`, `externalConnectionId`, …

**`IntegrationAuthorizationRequest`** — one-time handshake  
`requestId` (opaque, in URL), `jti` (consume-once), `companyId`, `companyName`, `userId`, `userName`, `userEmail`, `targetSystem`, `scopes[]`, `publicKey`, `expiresAt`, `status`: `pending` | `consumed` | `expired` | `cancelled`

### CRM (Phase 2 — implemented)

**`ConnectedIntegration`**

```text
provider: "clickmasters-erp"
externalCompanyId   ← ERP companyId
companyName
integrationConnectionId  ← ERP connection _id
publicKey, keyId, certificateFingerprint
scopes[]
status: active | revoked
connectedByUserId   ← CRM user
connectedAt, revokedAt
```

Never store ERP private keys on CRM.

Also: **`IntegrationAudit`** — authorize_viewed / authorized / confirm_failed / cancelled / revoked.

---

## 4. Phase 1 API reference (ERP — done)

Base path: `{ERP_API}/integrations`

| Method | Path | Auth | Does |
| --- | --- | --- | --- |
| `GET` | `/` | ERP user JWT | Catalog + connection status for UI |
| `POST` | `/:target/connect` | ERP user JWT | Create keys (if needed) + auth request; return `authorizeUrl`, `requestId`, `expiresAt` |
| `GET` | `/authorize-request/:requestId` | none (unguessable id) | Consent metadata for CRM |
| `POST` | `/confirm` | `X-Integration-Secret` | Consume request → `connection.status = active` |
| `POST` | `/:id/disconnect` | ERP user JWT | Revoke + cancel pending requests |
| `POST` | `/target/:target/disconnect` | ERP user JWT | Same by target id |

`target` values: `lead-crm` | `alpha-ai-tracker`

Default Lead CRM scopes: `crm.leads.read`, `crm.leads.create`, `crm.customers.read`

---

## 5. Phase 2 — DONE (built in CRM repo)

**Goal:** End-to-end Connect from ERP → Authorize on CRM → both sides show Connected.

### Steps (implemented)

| Step | What on CRM | Status |
| --- | --- | --- |
| **2.1** | Page `GET /connect/authorize?request=&target=` | ✅ |
| **2.2** | Proxy ERP `GET .../authorize-request/{requestId}` | ✅ |
| **2.3** | Require CRM login + `returnTo` | ✅ (JWT/localStorage; cookie session still optional) |
| **2.4** | Consent UI (company, scopes, Cancel / Authorize) | ✅ |
| **2.5** | Create `ConnectedIntegration` on Authorize | ✅ |
| **2.6** | Server-to-server ERP confirm + `X-Integration-Secret` | ✅ |
| **2.7** | Success → Connected Apps (`/integrations`) | ✅ |
| **2.8** | Cancel does not call confirm | ✅ |
| **2.9** | Disconnect on CRM (local revoke; ERP notify = Phase 5) | ✅ |
| **2.10** | Audit log (`IntegrationAudit`) | ✅ |

### CRM env to add

```env
ERP_API_BASE_URL=http://192.168.88.36:3000
# production: https://apierp.clickmasters.pk
INTEGRATION_CONFIRM_SECRET=clickmasters-integration-confirm-dev-change-me
```

Must match ERP `INTEGRATION_CONFIRM_SECRET`.

### CRM authorize page flow (code sketch)

```text
1. Parse requestId from ?request=
2. GET ERP /integrations/authorize-request/:requestId
3. If not logged in → /login?returnTo=/connect/authorize?request=...
4. Render consent (companyName, requestedBy, scopes, expiresAt)
5. Authorize click →
     a. save ConnectedIntegration
     b. POST ERP /integrations/confirm + X-Integration-Secret
     c. if ERP success → done; if fail → rollback / show error
```

### Phase 2 exit criteria

- [x] Connect from ERP opens real CRM consent page (not 404)
- [x] Cancel leaves ERP not active
- [x] Authorize → ERP shows Connected + CRM has ConnectedIntegration
- [x] Replaying same `requestId` after success fails (consumed)
- [x] Expired request shows clear error

---

## 6. Later phases (short)

### Phase 3 — Value (Web Leads for real)

- Replace hard-coded CRM JWT in ERP Web Leads with connection-scoped credential / ERP proxy.
- CRM APIs enforce scopes + linked `externalCompanyId`.
- Multi-tenant: each ERP company only sees its linked CRM data.

### Phase 4 — Alpha

- Same Phase 2 pattern with `targetSystem: alpha-ai-tracker` and Alpha authorize URL (already configured on ERP).

### Phase 5 — Harden

- Rate limits, key rotation, CRM→ERP disconnect webhook, monitoring, optional DPoP later.

---

## 7. Anti-patterns (do not regress)

| Avoid | Instead |
| --- | --- |
| JWT in `localStorage` as integration trust | HttpOnly session + server confirm |
| Trusting `companyId` from the browser | Confirm via ERP `/integrations/confirm` |
| Sending full authorize URL as confirm body | Send only `requestId` |
| Storing ERP private key on CRM | Public key only |
| Calling this an “OTP” | Authorization request / one-time code |

---

## 8. Success criteria (overall)

- [x] ERP can create / list / confirm / revoke integrations (Phase 1)
- [x] Connect from ERP opens CRM consent; Cancel leaves no connection
- [x] Authorize creates active records on **both** sides
- [ ] Disconnect blocks further API access
- [x] Replay of same authorize request fails
- [x] Expired request fails cleanly
- [ ] Web Leads uses integration credentials, not a shared admin JWT
- [ ] Adding Alpha does not redesign the handshake

---

## 9. One-line summary

**ERP starts Connect → CRM shows consent → CRM confirms to ERP with shared secret + `requestId` → both store an active connection → later APIs use scopes and public-key trust — never localStorage JWTs as the link.**

---

## 10. Handoff checklist for CRM developer / next chat

Phase 2 is implemented in this CRM repo. Remaining:

1. Add to CRM `.env` (see `.env.example`):
   - `ERP_API_BASE_URL` (e.g. `http://192.168.88.36:3000` or `https://apierp.clickmasters.pk`)
   - `INTEGRATION_CONFIRM_SECRET` (must match ERP)
2. End-to-end test: ERP Connect → CRM consent → both show Connected.
3. After Phase 2 works end-to-end, return to ERP for Phase 3 (Web Leads hardening).

### CRM files (Phase 2)

| File | Role |
| --- | --- |
| `app/connect/authorize/page.jsx` | Consent UI |
| `app/(dashboard)/integrations/page.jsx` | Connected Apps list + disconnect |
| `app/api/integrations/*` | Proxy, confirm, list, disconnect |
| `lib/models/ConnectedIntegration.js` | Durable CRM-side link |
| `lib/models/IntegrationAudit.js` | Audit log |
| `lib/services/erpIntegration.js` | ERP HTTP client (secret stays server-side) |
