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
 * Normalize ERP authorize-request payloads into a stable shape for the CRM UI/API.
 */
function normalizeAuthorizeRequest(raw, requestId) {
  if (!raw || typeof raw !== "object") return null;

  const data = raw.data && typeof raw.data === "object" ? raw.data : raw;
  const company = data.company && typeof data.company === "object" ? data.company : {};
  const user = data.user && typeof data.user === "object" ? data.user : {};
  const requestedBy =
    data.requestedBy && typeof data.requestedBy === "object" ? data.requestedBy : {};

  const companyId =
    data.companyId ||
    data.externalCompanyId ||
    company.id ||
    company._id ||
    data.company?._id ||
    "";

  const companyName =
    data.companyName || company.name || data.company || "";

  const requesterName =
    data.userName ||
    data.requesterName ||
    requestedBy.name ||
    user.name ||
    data.requestedByName ||
    "";

  const requesterEmail =
    data.userEmail ||
    data.requesterEmail ||
    requestedBy.email ||
    user.email ||
    "";

  const requesterId =
    data.userId ||
    requestedBy.id ||
    requestedBy._id ||
    user.id ||
    user._id ||
    "";

  const scopes = Array.isArray(data.scopes)
    ? data.scopes
    : Array.isArray(data.requestedScopes)
      ? data.requestedScopes
      : [];

  return {
    requestId: data.requestId || requestId,
    jti: data.jti || "",
    status: data.status || "pending",
    companyId: String(companyId),
    companyName: String(companyName || "Unknown company"),
    requesterId: String(requesterId),
    requesterName: String(requesterName || "Unknown"),
    requesterEmail: String(requesterEmail || ""),
    targetSystem: data.targetSystem || data.target || "lead-crm",
    scopes,
    publicKey: data.publicKey || "",
    keyId: data.keyId || "",
    certificateFingerprint:
      data.certificateFingerprint || data.fingerprint || "",
    integrationConnectionId: String(
      data.integrationConnectionId ||
        data.connectionId ||
        data.connection?._id ||
        data.connection?.id ||
        ""
    ),
    expiresAt: data.expiresAt || null,
    issuer: data.issuer || "",
    audience: data.audience || "",
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
      body.error || body.message || "This authorization request is invalid or has expired."
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
    const e = new Error("ERP authorize-request response is missing publicKey.");
    e.code = "ERP_BAD_RESPONSE";
    e.status = 502;
    throw e;
  }

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
