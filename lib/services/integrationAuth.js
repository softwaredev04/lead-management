const crypto = require("crypto");
const { NextResponse } = require("next/server");
const ConnectedIntegration = require("../models/ConnectedIntegration");
const { INTEGRATION_PROVIDER } = require("../config");

const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Ed25519 SPKI DER prefix (RFC 8410) + 32-byte raw public key.
 */
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function getIntegrationSecret() {
  const secret = process.env.INTEGRATION_CONFIRM_SECRET;
  if (!secret) {
    const err = new Error("INTEGRATION_CONFIRM_SECRET is not configured");
    err.status = 503;
    err.code = "NOT_CONFIGURED";
    throw err;
  }
  return secret;
}

function timingSafeEqualString(a, b) {
  const aa = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

/**
 * Build a KeyObject from ERP publicKey (PEM, base64 SPKI, or base64 raw 32-byte).
 */
function publicKeyToKeyObject(publicKey) {
  const raw = String(publicKey || "").trim();
  if (!raw) throw new Error("Missing public key");

  if (raw.includes("BEGIN PUBLIC KEY")) {
    return crypto.createPublicKey(raw);
  }

  // Try base64 SPKI DER, then raw 32-byte wrapped as SPKI
  const decoded = Buffer.from(raw, "base64");
  if (decoded.length === 0) {
    throw new Error("Invalid public key encoding");
  }

  try {
    return crypto.createPublicKey({
      key: decoded,
      format: "der",
      type: "spki",
    });
  } catch {
    // fall through
  }

  if (decoded.length === 32) {
    return crypto.createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, decoded]),
      format: "der",
      type: "spki",
    });
  }

  // Hex-encoded raw 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return crypto.createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(raw, "hex")]),
      format: "der",
      type: "spki",
    });
  }

  throw new Error("Unsupported public key format");
}

function verifyEd25519Signature({ publicKey, message, signatureBase64 }) {
  const keyObject = publicKeyToKeyObject(publicKey);
  const signature = Buffer.from(String(signatureBase64 || ""), "base64");
  if (signature.length === 0) return false;
  return crypto.verify(null, Buffer.from(String(message), "utf8"), keyObject, signature);
}

/**
 * Authenticate an inbound ERP → CRM integration API request.
 * Returns { integration } or { response } (NextResponse error).
 */
async function requireErpIntegration(request, { requiredScope } = {}) {
  try {
    getIntegrationSecret();
  } catch (err) {
    return {
      response: NextResponse.json({ error: err.message }, { status: err.status || 503 }),
    };
  }

  const secret = request.headers.get("x-integration-secret");
  if (!secret || !timingSafeEqualString(secret, getIntegrationSecret())) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized integration request" },
        { status: 401 }
      ),
    };
  }

  const companyId = request.headers.get("x-erp-company-id") || "";
  const connectionId = request.headers.get("x-erp-connection-id") || "";
  const keyId = request.headers.get("x-erp-key-id") || "";
  const timestampRaw = request.headers.get("x-erp-timestamp") || "";
  const signature = request.headers.get("x-erp-signature") || "";

  if (!companyId || !connectionId || !timestampRaw || !signature) {
    return {
      response: NextResponse.json(
        {
          error:
            "Missing required integration headers (X-ERP-Company-Id, X-ERP-Connection-Id, X-ERP-Timestamp, X-ERP-Signature)",
        },
        { status: 401 }
      ),
    };
  }

  const timestamp = Number(timestampRaw);
  if (!Number.isFinite(timestamp)) {
    return {
      response: NextResponse.json({ error: "Invalid X-ERP-Timestamp" }, { status: 401 }),
    };
  }

  const skew = Math.abs(Date.now() - timestamp);
  if (skew > MAX_TIMESTAMP_SKEW_MS) {
    return {
      response: NextResponse.json(
        { error: "Integration request timestamp expired or skewed" },
        { status: 401 }
      ),
    };
  }

  const query = {
    provider: INTEGRATION_PROVIDER,
    externalCompanyId: String(companyId),
    status: "active",
  };

  // Prefer exact ERP connection id match when present on our record
  let integration = await ConnectedIntegration.findOne({
    ...query,
    integrationConnectionId: String(connectionId),
  });

  if (!integration) {
    // Fallback: company + active (handles older records keyed by requestId)
    integration = await ConnectedIntegration.findOne(query).sort({ connectedAt: -1 });
  }

  if (!integration) {
    return {
      response: NextResponse.json(
        { error: "No active integration for this ERP company" },
        { status: 403 }
      ),
    };
  }

  if (keyId && integration.keyId && integration.keyId !== keyId) {
    return {
      response: NextResponse.json({ error: "Integration keyId mismatch" }, { status: 401 }),
    };
  }

  const message = `${timestamp}.${companyId}.${connectionId}`;
  let validSig = false;
  try {
    validSig = verifyEd25519Signature({
      publicKey: integration.publicKey,
      message,
      signatureBase64: signature,
    });
  } catch (err) {
    console.error("[integration-auth] signature verify error:", err.message);
    return {
      response: NextResponse.json(
        { error: "Integration signature verification failed" },
        { status: 401 }
      ),
    };
  }

  if (!validSig) {
    return {
      response: NextResponse.json(
        { error: "Invalid integration signature" },
        { status: 401 }
      ),
    };
  }

  if (requiredScope && !(integration.scopes || []).includes(requiredScope)) {
    return {
      response: NextResponse.json(
        { error: `Missing required scope: ${requiredScope}` },
        { status: 403 }
      ),
    };
  }

  return { integration };
}

module.exports = {
  requireErpIntegration,
  verifyEd25519Signature,
  publicKeyToKeyObject,
  MAX_TIMESTAMP_SKEW_MS,
};
