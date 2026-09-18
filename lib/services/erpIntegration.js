/**
 * Server-side ERP integration client.
 * Trust lives here — never expose INTEGRATION_CONFIRM_SECRET to the browser.
 */

function getErpBaseUrl() {
  const base = (process.env.ERP_API_BASE_URL || "").replace(/\/$/, "");
  if (!base) {
    const err = new Error(
      "ERP_API_BASE_URL is not configured. Set it in CRM .env to the ERP API host."
    );
    err.code = "ERP_NOT_CONFIGURED";
    err.status = 503;
    throw err;
  }
  return base;
}

function getConfirmSecret() {
  const secret = process.env.INTEGRATION_CONFIRM_SECRET;
  if (!secret) {
    const err = new Error(
      "INTEGRATION_CONFIRM_SECRET is not configured. It must match ERP."
    );
    err.code = "ERP_NOT_CONFIGURED";
    err.status = 503;
    throw err;
  }
  return secret;
}

/**
 * Prefer first non-empty string among candidates.
 */
function firstString(...values) {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (v != null && typeof v !== "object" && String(v).trim()) {
      return String(v).trim();
    }
  }
  return "";
}

/**
 * Deep-ish search for a public key field (ERP payload shapes vary).
 */
function extractPublicKey(root) {
  if (!root || typeof root !== "object") return "";

  const KEY_NAMES = [
    "publicKey",
    "public_key",
    "erpPublicKey",
    "signingPublicKey",
    "clientPublicKey",
    "publicKeyPem",
    "publicKeyBase64",
    "pubKey",
    "pk",
  ];

  const queue = [{ node: root, depth: 0 }];
  const seen = new Set();

  while (queue.length) {
    const { node, depth } = queue.shift();
    if (!node || typeof node !== "object" || seen.has(node) || depth > 5) continue;
    seen.add(node);

    for (const name of KEY_NAMES) {
      const val = node[name];
      if (typeof val === "string" && val.trim()) return val.trim();
      // Node Buffer JSON: { type: 'Buffer', data: number[] }
      if (val && typeof val === "object" && val.type === "Buffer" && Array.isArray(val.data)) {
        return Buffer.from(val.data).toString("base64");
      }
    }

    // Also match keys like publicKeyPem via regex on own keys
    for (const [k, v] of Object.entries(node)) {
      if (/public[_]?key/i.test(k) && typeof v === "string" && v.trim()) {
        return v.trim();
      }
      if (v && typeof v === "object" && !Array.isArray(v)) {
        queue.push({ node: v, depth: depth + 1 });
      }
    }
  }

  return "";
}

function topLevelKeys(obj) {
  if (!obj || typeof obj !== "object") return [];
  return Object.keys(obj);
}

/**
 * Normalize ERP authorize-request payloads into a stable shape for the CRM UI/API.
 */
function normalizeAuthorizeRequest(raw, requestId) {
  if (!raw || typeof raw !== "object") return null;

  // ERP often wraps: { success, data|request|authorizationRequest|... }
  const nested =
    (raw.data && typeof raw.data === "object" && raw.data) ||
    (raw.request && typeof raw.request === "object" && raw.request) ||
    (raw.authorizationRequest &&
      typeof raw.authorizationRequest === "object" &&
      raw.authorizationRequest) ||
    (raw.payload && typeof raw.payload === "object" && raw.payload) ||
    null;

  const data = nested || raw;
  const company = data.company && typeof data.company === "object" ? data.company : {};
  const user = data.user && typeof data.user === "object" ? data.user : {};
  const requestedBy =
    data.requestedBy && typeof data.requestedBy === "object" ? data.requestedBy : {};
  const connection =
    (data.connection && typeof data.connection === "object" && data.connection) ||
    (raw.connection && typeof raw.connection === "object" && raw.connection) ||
    (data.integrationConnection &&
      typeof data.integrationConnection === "object" &&
      data.integrationConnection) ||
    {};

  const companyId = firstString(
    data.companyId,
    data.externalCompanyId,
    company.id,
    company._id,
    raw.companyId,
    connection.companyId
  );

  const companyName = firstString(
    data.companyName,
    company.name,
    typeof data.company === "string" ? data.company : "",
    raw.companyName,
    connection.companyName
  );

  const requesterName = firstString(
    data.userName,
    data.requesterName,
    requestedBy.name,
    user.name,
    data.requestedByName,
    raw.userName
  );

  const requesterEmail = firstString(
    data.userEmail,
    data.requesterEmail,
    requestedBy.email,
    user.email,
    raw.userEmail
  );

  const requesterId = firstString(
    data.userId,
    requestedBy.id,
    requestedBy._id,
    user.id,
    user._id,
    raw.userId
  );

  const scopes = Array.isArray(data.scopes)
    ? data.scopes
    : Array.isArray(data.requestedScopes)
      ? data.requestedScopes
      : Array.isArray(raw.scopes)
        ? raw.scopes
        : Array.isArray(connection.scopes)
          ? connection.scopes
          : [];

  const publicKey = extractPublicKey(raw);

  return {
    requestId: firstString(data.requestId, raw.requestId, requestId),
    jti: firstString(data.jti, raw.jti),
    status: firstString(data.status, raw.status) || "pending",
    companyId: String(companyId),
    companyName: String(companyName || "Unknown company"),
    requesterId: String(requesterId),
    requesterName: String(requesterName || "Unknown"),
    requesterEmail: String(requesterEmail || ""),
    targetSystem:
      firstString(data.targetSystem, data.target, raw.targetSystem, connection.targetSystem) ||
      "lead-crm",
    scopes,
    publicKey,
    keyId: firstString(data.keyId, raw.keyId, connection.keyId, data.key_id),
    certificateFingerprint: firstString(
      data.certificateFingerprint,
      data.fingerprint,
      raw.certificateFingerprint,
      connection.certificateFingerprint
    ),
    integrationConnectionId: firstString(
      data.integrationConnectionId,
      data.connectionId,
      connection._id,
      connection.id,
      raw.integrationConnectionId,
      raw.connectionId
    ),
    expiresAt: data.expiresAt || raw.expiresAt || null,
    issuer: firstString(data.issuer, raw.issuer),
    audience: firstString(data.audience, raw.audience),
    _debugKeys: {
      root: topLevelKeys(raw),
      data: nested ? topLevelKeys(data) : [],
      connection: topLevelKeys(connection),
    },
  };
}

async function fetchAuthorizeRequest(requestId) {
  const base = getErpBaseUrl();
  const url = `${base}/integrations/authorize-request/${encodeURIComponent(requestId)}`;

  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    const e = new Error(
      `Could not reach ERP at ${base}. Check ERP_API_BASE_URL and network.`
    );
    e.code = "ERP_UNREACHABLE";
    e.status = 502;
    e.cause = err;
    throw e;
  }

  const body = await res.json().catch(() => ({}));

  if (res.status === 404 || res.status === 410) {
    const e = new Error(
      body.error ||
        body.message ||
        "This authorization request is invalid or has expired."
    );
    e.code = "REQUEST_INVALID";
    e.status = res.status === 410 ? 410 : 404;
    throw e;
  }

  if (!res.ok) {
    const e = new Error(
      body.error || body.message || `ERP returned ${res.status}`
    );
    e.code = "ERP_ERROR";
    e.status = 502;
    throw e;
  }

  const normalized = normalizeAuthorizeRequest(body, requestId);
  if (!normalized?.publicKey) {
    console.error(
      "[erpIntegration] authorize-request missing publicKey. keys=",
      JSON.stringify(normalized?._debugKeys || {}),
      "sample=",
      JSON.stringify(body)?.slice(0, 800)
    );
    const e = new Error(
      "ERP authorize-request response is missing publicKey. " +
        "ERP must include the connection publicKey (or public_key) in this payload. " +
        `Seen keys: ${JSON.stringify(normalized?._debugKeys || {})}`
    );
    e.code = "ERP_BAD_RESPONSE";
    e.status = 502;
    e.debugKeys = normalized?._debugKeys;
    throw e;
  }

  // Strip debug before returning to clients
  delete normalized._debugKeys;

  if (normalized.status && !["pending"].includes(normalized.status)) {
    const e = new Error(
      normalized.status === "consumed"
        ? "This authorization request was already used."
        : `This authorization request is ${normalized.status}.`
    );
    e.code = "REQUEST_INVALID";
    e.status = 410;
    throw e;
  }

  if (normalized.expiresAt && new Date(normalized.expiresAt).getTime() < Date.now()) {
    const e = new Error("This authorization request has expired. Start Connect again from ERP.");
    e.code = "REQUEST_EXPIRED";
    e.status = 410;
    throw e;
  }

  return normalized;
}

async function confirmWithErp({
  requestId,
  jti,
  externalConnectionId,
  externalCompanyId,
  connectedByExternalUserId,
}) {
  const base = getErpBaseUrl();
  const secret = getConfirmSecret();
  const url = `${base}/integrations/confirm`;

  const payload = { requestId };
  if (jti) payload.jti = jti;
  if (externalConnectionId) payload.externalConnectionId = String(externalConnectionId);
  if (externalCompanyId) payload.externalCompanyId = String(externalCompanyId);
  if (connectedByExternalUserId) {
    payload.connectedByExternalUserId = String(connectedByExternalUserId);
  }

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Integration-Secret": secret,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (err) {
    const e = new Error(
      `Could not reach ERP confirm endpoint at ${base}.`
    );
    e.code = "ERP_UNREACHABLE";
    e.status = 502;
    e.cause = err;
    throw e;
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const e = new Error(
      body.error || body.message || `ERP confirm failed (${res.status})`
    );
    e.code = res.status === 401 ? "ERP_UNAUTHORIZED" : "ERP_CONFIRM_FAILED";
    e.status = res.status === 401 ? 502 : 502;
    e.erpStatus = res.status;
    e.erpBody = body;
    throw e;
  }

  return body;
}

module.exports = {
  getErpBaseUrl,
  fetchAuthorizeRequest,
  confirmWithErp,
  normalizeAuthorizeRequest,
};
