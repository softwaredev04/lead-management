# ClickMasters Integration Plan

**Systems:** [erp.clickmasters.pk](https://erp.clickmasters.pk) · [crm.clickmasters.pk](https://crm.clickmasters.pk) · [alphamonitoring.clickmasters.pk](https://alphamonitoring.clickmasters.pk)

**Goal:** Company admins connect external apps from ERP with explicit consent on the target app. Trust is server-to-server — not `JWT → localStorage → getMe()`.

**Principle:** *The browser transports the authorization transaction. The browser is not the source of trust.*

---

## 00. Session summary — what we built, issues, fixes (take a break / handoff)

> **Date:** 2026-09-18 · **Repos:** CRM (`lead-crm`) + ERP Project Connectors  
> **Copy both** `erpplan.md` + `leadcrmplan.md` when switching projects.

### Big picture

We connected **ClickMasters ERP** ↔ **Lead CRM** so a company admin can **Connect** from ERP, **Authorize** on CRM, then use **Web Leads** without putting a CRM JWT in the browser. Trust is: opaque `requestId` in the URL + shared `INTEGRATION_CONFIRM_SECRET` + Ed25519 public key on CRM.

```text
ERP Connect → CRM /connect/authorize → login if needed → consent
  → CRM saves ConnectedIntegration (publicKey)
  → CRM POST ERP /integrations/confirm
  → both show Connected
  → ERP Web Leads → ERP proxy → CRM GET /api/integrations/leads (signed)
```

### Phases completed in this work

| Phase | What | Result |
| --- | --- | --- |
| **0–1** | ERP Project Connectors UI + `/integrations/*` | Already done (ERP) |
| **2** | CRM consent page, confirm, Connected Apps, audit | ✅ Built on CRM |
| **3** | ERP Web Leads proxy + CRM signed leads API | ✅ Built both sides |
| **5a** | Disconnect status sync (webhook + live poll) | ✅ CRM done · ⬜ ERP endpoint still needed |

**Still pending:** ERP `POST /integrations/external-disconnect` + ERP→CRM webhook on Disconnect · optional Socket.io · Alpha (Phase 4) · multi-tenant lead partitioning.

---

### What we built on CRM (how)

1. **Consent** — `app/connect/authorize/page.jsx`  
   Outside dashboard layout. Reads `?request=&target=`. If not logged in → `/login?returnTo=...`. Shows company, requester, scopes. Cancel does nothing to ERP; Authorize calls CRM API.

2. **Login returnTo** — `app/login/page.jsx`  
   After login, redirects to safe same-origin path (blocks open redirects).

3. **Models** — `ConnectedIntegration`, `IntegrationAudit`  
   Store ERP public key + scopes only (never private key). Audit authorize/revoke/confirm failures.

4. **APIs**
   - `GET /api/integrations/authorize-request/:id` — proxy to ERP (auth required)
   - `POST /api/integrations/confirm` — save link + confirm ERP with `X-Integration-Secret`
   - `GET /api/integrations` — list connections
   - `POST /api/integrations/:id/disconnect` — revoke CRM + **notify ERP**
   - `GET /api/integrations/leads` — ERP-signed scoped leads (`crm.leads.read`)
   - `POST /api/integrations/webhook/status` — ERP can push revoked/active

5. **Services**
   - `lib/services/erpIntegration.js` — fetch authorize-request, confirm, disconnect notify; flexible `publicKey` extraction
   - `lib/services/integrationAuth.js` — verify secret + Ed25519 + timestamp skew ≤5m

6. **UI** — Connected Apps (`/integrations`) in sidebar; live poll every 5s; toast when status changes.

7. **Env (CRM `.env`)**
   ```env
   ERP_API_BASE_URL=https://apierp.clickmasters.pk
   INTEGRATION_CONFIRM_SECRET=<same as ERP>
   CRM_EXTERNAL_COMPANY_ID=clickmasters-lead-crm
   ```

---

### Issues we hit — and how we solved them

#### Issue 1 — Consent error: “missing publicKey”

| | |
| --- | --- |
| **Symptom** | CRM consent UI: *Cannot authorize — ERP authorize-request response is missing publicKey* |
| **Cause** | ERP returned the key only under `data.trust.publicKey`. Early CRM code expected top-level / `data.publicKey`. |
| **CRM fix** | Deep extraction of `publicKey` / `public_key` / `trust.publicKey` / nested `connection`, etc. Better error with seen keys. |
| **ERP fix** | Expose canonical **top-level `data.publicKey`** (keep `trust` for compatibility). |
| **Lesson** | Agree field names in the authorize-request JSON; PEM SPKI is the encoding. |
| **Status** | ✅ Solved — Connect/Authorize works after re-Connect (new `requestId`; TTL ~60s). |

#### Issue 2 — Status drift: CRM Revoked vs ERP Connected

| | |
| --- | --- |
| **Symptom** | After Disconnect on CRM Connected Apps → **Revoked**. ERP Project Connectors still **Connected**. |
| **Cause** | CRM revoke was local-only (Phase 5 not done). ERP never got a server notify. |
| **CRM fix** | On disconnect, call `POST {ERP}/integrations/external-disconnect` with secret. Add inbound `POST /api/integrations/webhook/status`. Live-poll Connected Apps every 5s. |
| **ERP still needs** | Implement `external-disconnect` + on ERP Disconnect POST CRM webhook. Until then toast may say ERP was not notified. |
| **Sockets** | User wanted real-time. We use **HTTP webhooks (source of truth)** + **5s poll (UI)**. Socket.io later if needed — not trust. |
| **Status** | 🟡 CRM ready · ERP endpoint pending |

#### Issue 3 — Expired authorize links

| | |
| --- | --- |
| **Symptom** | Old `?request=` URLs return 410 Gone. |
| **Cause** | One-time requests expire (~60s). |
| **Fix** | Always **Connect again** from ERP UI; don’t reuse old links. |
| **Status** | ✅ Expected behavior |

#### Issue 4 — Cross-repo coordination

| | |
| --- | --- |
| **Symptom** | Fixes land on one repo; the other side doesn’t know the contract. |
| **Fix** | Dual plans `erpplan.md` + `leadcrmplan.md`, questionnaires with **ANSWER:** lines for the other AI, copy both files when switching. |
| **Status** | ✅ Process in place |

---

### Working end-to-end checklist (when both sides deployed)

1. ERP → Project Connectors → **Connect** Lead CRM  
2. CRM consent → **Authorize** → both show Connected  
3. ERP Web Leads loads leads (no CRM JWT in browser)  
4. CRM Connected Apps → **Disconnect** → CRM Revoked **and** ERP Revoked (needs ERP Phase 5)  
5. ERP Disconnect → CRM Revoked via webhook (needs ERP Phase 5)

---

### CRM file map (quick)

| File | Role |
| --- | --- |
| `app/connect/authorize/page.jsx` | Consent UI |
| `app/login/page.jsx` | `?returnTo=` |
| `app/(dashboard)/integrations/page.jsx` | Connected Apps + live poll |
| `app/api/integrations/**` | Proxy, confirm, list, disconnect, leads, webhook |
| `lib/models/ConnectedIntegration.js` | Link record |
| `lib/models/IntegrationAudit.js` | Audit log |
| `lib/services/erpIntegration.js` | ERP HTTP client |
| `lib/services/integrationAuth.js` | Inbound signature verify |
| `leadcrmplan.md` / `erpplan.md` | This plan pair |

---

## ★ FOR ERP AI ASSISTANT — read & answer (copy this file into the ERP repo)

**You are in the ERP codebase.** CRM is failing Connect consent with:

> `ERP authorize-request response is missing publicKey.`

CRM calls: `GET {ERP_API}/integrations/authorize-request/{requestId}`  
Then stores that `publicKey` on `ConnectedIntegration` and later verifies Web Leads Ed25519 signatures with it.

**Your job:** Inspect ERP integration models/controllers/utils, answer every question below with evidence (file path + short snippet or field list). If something is unclear, say what is missing and propose the fix. Prefer fixing the authorize-request handler so the JSON always includes a non-empty `publicKey`.

### Context CRM already has

- Consent UI: `https://crm.clickmasters.pk/connect/authorize?request=<id>&target=lead-crm`
- CRM reads nested keys too (`publicKey`, `public_key`, `publicKeyPem`, under `data` / `connection`, etc.) — empty/omitted still fails
- Confirm: `POST /integrations/confirm` + header `X-Integration-Secret`
- Leads: CRM `GET /api/integrations/leads` expects secret + Ed25519 over `` `${timestamp}.${companyId}.${connectionId}` ``

### Questions — answer in place

**A. Authorize-request payload**

1. What exact JSON does `GET /integrations/authorize-request/:requestId` return today? (List top-level keys + nested keys; paste a redacted example.)  
   **ANSWER:** `{ success, data: { requestId, jti, status, companyId, companyName, userName, userEmail, targetSystem, scopes, publicKey, keyId, certificateFingerprint, connectionId, expiresAt, company{…}, requestedBy{…}, trust{ keyId, certificateFingerprint, publicKey }, issuer, audience } }` — `publicKey` is now **top-level under `data`** (was only under `data.trust` before the fix).

2. Where does `publicKey` live — on `IntegrationAuthorizationRequest`, only on `IntegrationConnection`, both, or nowhere in the GET response?  
   **ANSWER:** **Both** — copied onto `IntegrationAuthorizationRequest` at Connect (`startConnect` create), and stored on `IntegrationConnection`. GET returns it (and falls back to connection if snapshot empty).

3. On Connect, does ERP copy `publicKey` / `keyId` / `connectionId` onto the authorization request document? Cite the create/connect code.  
   **ANSWER:** **Yes** — `integration.controller.js` `IntegrationAuthorizationRequest.create({ … publicKey: connection.publicKey, keyId, certificateFingerprint, connectionId: connection._id })`.

4. Is `publicKey` excluded via `select: false`, a DTO omit, or `.select()` projection on the authorize-request GET?  
   **ANSWER:** **No** — only `privateKeyEncrypted` on Connection is `select: false`. `publicKey` is a normal String field. CRM failure was nesting (`trust.publicKey`), not DB omit.

5. What encoding is stored/returned for `publicKey`? (PEM / base64 SPKI / base64 raw 32-byte / other)  
   **ANSWER:** **PEM SPKI** (`crypto.generateKeyPairSync('ed25519', { publicKeyEncoding: { type: 'spki', format: 'pem' } })` in `integrationCrypto.utils.js`).

**B. Connect flow**

6. Are Ed25519 keys generated before the authorize URL is returned to the browser?  
   **ANSWER:** **Yes** — keypair created (or reused) on Connection before `AuthorizationRequest.create` and before `authorizeUrl` is returned.

7. Exact `LEAD_CRM_AUTHORIZE_URL` / authorize URL builder (path + query params)?  
   **ANSWER:** `{LEAD_CRM_AUTHORIZE_URL||https://crm.clickmasters.pk/connect/authorize}?request={requestId}&target={targetSystem}`

8. Value of `INTEGRATION_AUTH_TTL_SECONDS` (default if unset)?  
   **ANSWER:** **60** (env or default in controller).

**C. Env**

9. Confirm env keys exist and purpose: `INTEGRATION_CONFIRM_SECRET`, `LEAD_CRM_AUTHORIZE_URL`, `CRM_API_BASE_URL`. Any mismatch risk with CRM?  
   **ANSWER:** All in ERP `.env`. Confirm secret must match CRM. `CRM_API_BASE_URL` used by Web Leads proxy. Mismatch of secret → 401 on confirm/leads.

10. Is private key the only secret field (`select: false`)? Public key must be readable for CRM.  
    **ANSWER:** **Yes** — only `privateKeyEncrypted` is `select: false`. `publicKey` is readable.

**D. Confirm + Web Leads signing**

11. What body fields does `POST /integrations/confirm` accept/require?  
    **ANSWER:** **Required:** `requestId`. **Optional:** `jti`, `externalConnectionId`, `externalCompanyId`, `connectedByExternalUserId`. Header **`X-Integration-Secret`** required.

12. Exact string signed for CRM leads proxy: is it `` `${timestamp}.${companyId}.${connectionId}` ``? Which ids (company `_id`? connection `_id`)?  
    **ANSWER:** **Yes** — `` `${timestamp}.${companyId}.${connectionId}` `` where `companyId` = `req.user.companyId` (string business id), `connectionId` = `IntegrationConnection._id` (Mongo id string).

13. Header names ERP sends to CRM for leads — match `X-Integration-Secret`, `X-ERP-Company-Id`, `X-ERP-Connection-Id`, `X-ERP-Key-Id`, `X-ERP-Timestamp`, `X-ERP-Signature`?  
    **ANSWER:** **Yes** — all six in `getLeadCrmLeads`.

**E. Verdict**

14. Today, within ~10s of Connect, does authorize-request JSON include a **non-empty** `publicKey`? **Yes / No**  
    **ANSWER:** **Yes** (after fix: top-level `data.publicKey`; previously only `data.trust.publicKey`).

15. If No: root cause + concrete code change (file + what to return). If Yes: why would CRM still report missing (wrong path, wrapper, empty string, different field name)?  
    **ANSWER:** CRM looked for top-level `publicKey`; ERP nested it under `trust`. **Fixed** in `getAuthorizeRequest` to expose canonical top-level fields + keep `trust` for compatibility. Re-Connect from ERP (new requestId) after backend restart.

### After answering

- If `publicKey` is missing: **implement the fix** on ERP `GET /integrations/authorize-request/:id` (and on Connect create if needed), then tell the human to Connect again from ERP UI.
- Required minimum fields in the response (canonical):

```json
{
  "requestId": "...",
  "jti": "...",
  "status": "pending",
  "companyId": "...",
  "companyName": "...",
  "userName": "...",
  "userEmail": "...",
  "targetSystem": "lead-crm",
  "scopes": ["crm.leads.read", "crm.leads.create", "crm.customers.read"],
  "publicKey": "<REQUIRED non-empty Ed25519 public key>",
  "keyId": "...",
  "connectionId": "<IntegrationConnection _id>",
  "expiresAt": "..."
}
```

Wrapper like `{ "success": true, "data": { ... } }` is fine if `publicKey` is inside.

---

## 0. Progress snapshot (read this first when switching projects)

| Phase | Status | Where |
| --- | --- | --- |
| **0** UI shell (Project Connectors page) | ✅ Done | ERP frontend |
| **1** ERP connection core (models + APIs + UI wired) | ✅ Done | ERP backend + frontend |
| **2** CRM authorize + consent + confirm | ✅ Done | CRM ✅ · ERP ✅ |
| **3** Scoped APIs + Web Leads via integration | ✅ Done | Both |
| **5a** Disconnect status sync | 🟡 CRM done · ERP endpoint pending | See §00 + ★ Phase 5 |
| **4** Alpha AI Tracker | Pending | Alpha + ERP |
| **5b** Socket.io (optional) / harden | Pending | After 5a |

### What works today (ERP + CRM Phase 2–3 code)

1. Admin opens **Configurations → Project Connectors** → **Connect** Lead CRM → opens CRM `/connect/authorize?request=...`.
2. CRM consent + confirm + Connected Apps — implemented.
3. ERP Web Leads proxy + CRM signed leads API — implemented.
4. **Fixed:** authorize-request returns canonical + alias fields (`publicKey`, `companyId`, `company.id`, `company.name`, etc.).

### What does NOT work yet

- **Status drift:** CRM Disconnect left ERP still **Connected** — CRM now calls ERP `external-disconnect`; ERP must implement it + call CRM webhook on its Disconnect (see ★ Phase 5 below / `erpplan.md`).
- Multi-tenant lead partitioning per ERP company (CRM is still single-tenant).
- Optional Socket.io (CRM uses webhook + 5s live poll for now).

---

## ★ Phase 5 — Status sync (CRM done · ERP must implement)

### Problem observed

CRM showed **Revoked** while ERP still showed **Connected** after Disconnect on Connected Apps.

### CRM now does

| Direction | Endpoint |
| --- | --- |
| CRM → ERP | `POST {ERP}/integrations/external-disconnect` + `X-Integration-Secret` |
| ERP → CRM | `POST {CRM}/api/integrations/webhook/status` + `X-Integration-Secret` |
| CRM UI | Connected Apps live-polls every 5s |

Body CRM → ERP:

```json
{
  "connectionId": "<ERP IntegrationConnection _id>",
  "companyId": "<ERP companyId>",
  "externalConnectionId": "<CRM ConnectedIntegration _id>",
  "targetSystem": "lead-crm",
  "reason": "revoked_on_crm",
  "status": "revoked"
}
```

### ERP must

1. Add `POST /integrations/external-disconnect` (secret, not JWT) → set connection `revoked`.
2. On ERP Disconnect UI → `POST {CRM_API_BASE_URL}/api/integrations/webhook/status` with `{ status: "revoked", connectionId, companyId }`.
3. Refresh Project Connectors UI when status changes.

Full ERP AI questions: see `erpplan.md` ★ Phase 5.

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

### Phase 3 — Value (Web Leads for real) — DONE

**ERP (done):**

- `GET /integrations/lead-crm/leads` proxy (active connection + scope + signed outbound call).
- `PanelWebLeads` uses ERP JWT only (hard-coded CRM token removed).
- Env: `CRM_API_BASE_URL=https://crm.clickmasters.pk`

**CRM (done):**

```http
GET /api/integrations/leads?page&limit&sort&order
Headers:
  X-Integration-Secret
  X-ERP-Company-Id
  X-ERP-Connection-Id
  X-ERP-Key-Id
  X-ERP-Timestamp
  X-ERP-Signature   # Ed25519 over `${timestamp}.${companyId}.${connectionId}`
```

Verify secret → find active `ConnectedIntegration` by `externalCompanyId` → verify signature with stored `publicKey` (skew ≤5m) → enforce `crm.leads.read` → return non-test leads:

`{ data, page, limit, total, totalPages }`

Files: `app/api/integrations/leads/route.js`, `lib/services/integrationAuth.js`

See also `erpplan.md` §0.1b for the full contract.

### Phase 4 — Alpha

- Same Phase 2 pattern with `targetSystem: alpha-ai-tracker` and Alpha authorize URL (already configured on ERP).

### Phase 5 — Harden / status sync

- ✅ CRM→ERP disconnect notify (`notifyErpDisconnect`)
- ✅ ERP→CRM webhook `/api/integrations/webhook/status`
- ✅ Connected Apps 5s live poll
- ⬜ ERP `POST /integrations/external-disconnect` + notify CRM on ERP Disconnect
- ⬜ Optional Socket.io both UIs (after webhook parity)
- Rate limits, key rotation, monitoring later

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
- [x] CRM disconnect blocks further signed lead API access
- [ ] Both UIs show same Connected/Revoked (needs ERP external-disconnect)
- [x] Replay of same authorize request fails
- [x] Expired request fails cleanly
- [x] Web Leads uses integration credentials, not a shared admin JWT
- [ ] Adding Alpha does not redesign the handshake

---

## 9. One-line summary

**ERP starts Connect → CRM shows consent → CRM confirms to ERP with shared secret + `requestId` → both store an active connection → later APIs use scopes and public-key trust — never localStorage JWTs as the link.**

---

## 10. Handoff — copy `erpplan.md` + `leadcrmplan.md` into the other repo

**Read §00 Session summary first.** Connect works. Next: ERP ★ Phase 5 so Revoked/Connected never drift.

Tell ERP AI: *“Read §00 and ★ Phase 5. Implement external-disconnect + CRM webhook. Answer ANSWER lines.”*

### CRM files (Phase 2–5a)

| File | Role |
| --- | --- |
| `app/connect/authorize/page.jsx` | Consent UI |
| `app/(dashboard)/integrations/page.jsx` | Connected Apps + live poll |
| `app/api/integrations/[id]/disconnect/route.js` | Revoke + notify ERP |
| `app/api/integrations/webhook/status/route.js` | ERP → CRM status webhook |
| `app/api/integrations/leads/route.js` | ERP-signed scoped leads |
| `lib/services/erpIntegration.js` | Confirm + disconnect notify |
| `lib/services/integrationAuth.js` | Inbound Ed25519 auth |
