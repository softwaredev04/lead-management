import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import ConnectedIntegration from "@/lib/models/ConnectedIntegration";
import IntegrationAudit from "@/lib/models/IntegrationAudit";
import {
  fetchAuthorizeRequest,
  confirmWithErp,
} from "@/lib/services/erpIntegration";
import { INTEGRATION_PROVIDER, INTEGRATION_TARGET } from "@/lib/config";

const confirmSchema = z.object({
  requestId: z.string().min(16).max(128),
});

/**
 * Authorize ERP connection:
 * 1. Re-fetch one-time request from ERP
 * 2. Persist ConnectedIntegration (public key only)
 * 3. Server-to-server confirm with X-Integration-Secret
 * 4. Rollback local record if ERP confirm fails
 */
export async function POST(request) {
  const { user, response } = requireAuth(request);
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { requestId } = parsed.data;
  if (!/^[a-f0-9]{16,128}$/i.test(requestId)) {
    return NextResponse.json(
      { error: "Invalid authorization request id" },
      { status: 400 }
    );
  }

  let createdId = null;

  try {
    await connectDB();

    const meta = await fetchAuthorizeRequest(requestId);

    if (!meta.companyId) {
      return NextResponse.json(
        { error: "ERP authorize-request is missing companyId" },
        { status: 502 }
      );
    }

    const connectionKey =
      meta.integrationConnectionId || `req:${meta.requestId}`;

    let integration = await ConnectedIntegration.findOne({
      provider: INTEGRATION_PROVIDER,
      integrationConnectionId: connectionKey,
    });

    const actorId = user.userId || null;
    const now = new Date();

    if (integration) {
      integration.externalCompanyId = meta.companyId;
      integration.companyName = meta.companyName;
      integration.publicKey = meta.publicKey;
      integration.keyId = meta.keyId;
      integration.certificateFingerprint = meta.certificateFingerprint;
      integration.scopes = meta.scopes;
      integration.status = "active";
      integration.connectedByUserId = actorId;
      integration.connectedByName = user.name || "";
      integration.connectedByEmail = user.email || "";
      integration.requestId = meta.requestId;
      integration.jti = meta.jti;
      integration.targetSystem = meta.targetSystem || INTEGRATION_TARGET;
      integration.connectedAt = now;
      integration.revokedAt = null;
      integration.revokedByUserId = null;
      await integration.save();
    } else {
      integration = await ConnectedIntegration.create({
        provider: INTEGRATION_PROVIDER,
        externalCompanyId: meta.companyId,
        companyName: meta.companyName,
        integrationConnectionId: connectionKey,
        publicKey: meta.publicKey,
        keyId: meta.keyId,
        certificateFingerprint: meta.certificateFingerprint,
        scopes: meta.scopes,
        status: "active",
        connectedByUserId: actorId,
        connectedByName: user.name || "",
        connectedByEmail: user.email || "",
        requestId: meta.requestId,
        jti: meta.jti,
        targetSystem: meta.targetSystem || INTEGRATION_TARGET,
        connectedAt: now,
      });
      createdId = integration._id;
    }

    const crmExternalCompanyId =
      process.env.CRM_EXTERNAL_COMPANY_ID || "clickmasters-lead-crm";

    try {
      await confirmWithErp({
        requestId: meta.requestId,
        jti: meta.jti,
        externalConnectionId: integration._id,
        externalCompanyId: crmExternalCompanyId,
        connectedByExternalUserId: actorId,
      });
    } catch (confirmErr) {
      if (createdId) {
        await ConnectedIntegration.deleteOne({ _id: createdId });
      } else if (integration) {
        integration.status = "revoked";
        integration.revokedAt = new Date();
        await integration.save();
      }

      await IntegrationAudit.logIntegrationAudit({
        action: "confirm_failed",
        requestId: meta.requestId,
        jti: meta.jti,
        externalCompanyId: meta.companyId,
        companyName: meta.companyName,
        actorUserId: actorId,
        actorName: user.name || "",
        actorEmail: user.email || "",
        actorRole: user.role || "",
        message: confirmErr.message,
        meta: { erpStatus: confirmErr.erpStatus, erpBody: confirmErr.erpBody },
      });

      throw confirmErr;
    }

    await IntegrationAudit.logIntegrationAudit({
      action: "authorized",
      provider: INTEGRATION_PROVIDER,
      requestId: meta.requestId,
      jti: meta.jti,
      externalCompanyId: meta.companyId,
      companyName: meta.companyName,
      integrationId: integration._id,
      actorUserId: actorId,
      actorName: user.name || "",
      actorEmail: user.email || "",
      actorRole: user.role || "",
      message: `Authorized ClickMasters ERP for ${meta.companyName}`,
      meta: { scopes: meta.scopes, keyId: meta.keyId },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: integration._id,
        provider: integration.provider,
        companyName: integration.companyName,
        externalCompanyId: integration.externalCompanyId,
        scopes: integration.scopes,
        status: integration.status,
        connectedAt: integration.connectedAt,
      },
    });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to confirm integration" },
      { status }
    );
  }
}
