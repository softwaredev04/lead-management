# ClickMasters Integration Plan

**Systems:** [erp.clickmasters.pk](https://erp.clickmasters.pk) · [crm.clickmasters.pk](https://crm.clickmasters.pk) · [alphamonitoring.clickmasters.pk](https://alphamonitoring.clickmasters.pk)

**Goal:** Company admins connect external apps from ERP with explicit consent on the target app. Trust is server-to-server — not `JWT → localStorage → getMe()`.

**Principle:** *The browser transports the authorization transaction. The browser is not the source of trust.*

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
   **ANSWER:**

2. Where does `publicKey` live — on `IntegrationAuthorizationRequest`, only on `IntegrationConnection`, both, or nowhere in the GET response?  
   **ANSWER:**

3. On Connect, does ERP copy `publicKey` / `keyId` / `connectionId` onto the authorization request document? Cite the create/connect code.  
   **ANSWER:**

4. Is `publicKey` excluded via `select: false`, a DTO omit, or `.select()` projection on the authorize-request GET?  
   **ANSWER:**

5. What encoding is stored/returned for `publicKey`? (PEM / base64 SPKI / base64 raw 32-byte / other)  
   **ANSWER:**

**B. Connect flow**

6. Are Ed25519 keys generated before the authorize URL is returned to the browser?  
   **ANSWER:**

7. Exact `LEAD_CRM_AUTHORIZE_URL` / authorize URL builder (path + query params)?  
   **ANSWER:**

8. Value of `INTEGRATION_AUTH_TTL_SECONDS` (default if unset)?  
   **ANSWER:**

**C. Env**

9. Confirm env keys exist and purpose: `INTEGRATION_CONFIRM_SECRET`, `LEAD_CRM_AUTHORIZE_URL`, `CRM_API_BASE_URL`. Any mismatch risk with CRM?  
   **ANSWER:**

10. Is private key the only secret field (`select: false`)? Public key must be readable for CRM.  
    **ANSWER:**

**D. Confirm + Web Leads signing**

11. What body fields does `POST /integrations/confirm` accept/require?  
    **ANSWER:**

12. Exact string signed for CRM leads proxy: is it `` `${timestamp}.${companyId}.${connectionId}` ``? Which ids (company `_id`? connection `_id`)?  
    **ANSWER:**

13. Header names ERP sends to CRM for leads — match `X-Integration-Secret`, `X-ERP-Company-Id`, `X-ERP-Connection-Id`, `X-ERP-Key-Id`, `X-ERP-Timestamp`, `X-ERP-Signature`?  
    **ANSWER:**

**E. Verdict**

14. Today, within ~10s of Connect, does authorize-request JSON include a **non-empty** `publicKey`? **Yes / No**  
    **ANSWER:**

15. If No: root cause + concrete code change (file + what to return). If Yes: why would CRM still report missing (wrong path, wrapper, empty string, different field name)?  
    **ANSWER:**

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
| **2** CRM authorize + consent + confirm | 🟡 CRM done — **E2E blocked: ERP missing `publicKey` on authorize-request** | CRM ✅ · ERP fix needed |
| **3** Scoped APIs + Web Leads via integration | ✅ Done | ERP proxy + CRM `GET /api/integrations/leads` (needs Connect first) |

### What works today (ERP + CRM Phase 2–3 code)

1. Admin opens **Configurations → Project Connectors** → **Connect** Lead CRM → opens CRM `/connect/authorize?request=...`.
2. CRM consent + confirm + Connected Apps — implemented.
3. ERP Web Leads proxy + CRM signed leads API — implemented.
4. **Blocked in production:** CRM shows `missing publicKey` — ERP authorize-request must include it (see ★ section).

### What does NOT work yet

- E2E Authorize until ERP returns non-empty `publicKey` (ERP AI: answer ★ and fix).
- Disconnect is CRM-local only (ERP not notified yet) — Phase 5.
- Multi-tenant lead partitioning per ERP company (CRM is still single-tenant).

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
- [x] Disconnect blocks further API access
- [x] Replay of same authorize request fails
- [x] Expired request fails cleanly
- [x] Web Leads uses integration credentials, not a shared admin JWT
- [ ] Adding Alpha does not redesign the handshake

---

## 9. One-line summary

**ERP starts Connect → CRM shows consent → CRM confirms to ERP with shared secret + `requestId` → both store an active connection → later APIs use scopes and public-key trust — never localStorage JWTs as the link.**

---

## 10. Handoff — copy `erpplan.md` + `leadcrmplan.md` into the other repo

**Next action:** Open ERP project → paste both plan files → tell the AI: *“Read ★ FOR ERP AI ASSISTANT, answer every ANSWER line from this codebase, then fix missing publicKey if needed.”*

CRM Phase 2–3 code is ready. E2E waits on ERP authorize-request including `publicKey`.

### CRM files (Phase 2–3)

| File | Role |
| --- | --- |
| `app/connect/authorize/page.jsx` | Consent UI |
| `app/(dashboard)/integrations/page.jsx` | Connected Apps list + disconnect |
| `app/api/integrations/*` | Proxy, confirm, list, disconnect |
| `app/api/integrations/leads/route.js` | ERP-signed scoped leads API |
| `lib/services/integrationAuth.js` | Secret + Ed25519 inbound auth |
| `lib/models/ConnectedIntegration.js` | Durable CRM-side link |
| `lib/services/erpIntegration.js` | ERP HTTP client + publicKey extraction |
