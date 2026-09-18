import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import ConnectedIntegration from "@/lib/models/ConnectedIntegration";
import IntegrationAudit from "@/lib/models/IntegrationAudit";
import { INTEGRATION_PROVIDER, INTEGRATION_TARGET } from "@/lib/config";
import { notifyErpDisconnect } from "@/lib/services/erpIntegration";

/**
 * Disconnect / revoke on CRM, then notify ERP so both UIs stay in sync.
 */
export async function POST(request, { params }) {
  const { user, response } = requireAdmin(request);
  if (response) return response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing integration id" }, { status: 400 });
  }

  try {
    await connectDB();
    const integration = await ConnectedIntegration.findById(id);
    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    if (integration.status === "revoked") {
      return NextResponse.json({
        success: true,
        data: { id: integration._id, status: "revoked" },
        erpNotified: false,
        erpNote: "Already revoked on CRM",
      });
    }

    integration.status = "revoked";
    integration.revokedAt = new Date();
    integration.revokedByUserId = user.userId || null;
    await integration.save();

    await IntegrationAudit.logIntegrationAudit({
      action: "revoked",
      provider: INTEGRATION_PROVIDER,
      requestId: integration.requestId,
      jti: integration.jti,
      externalCompanyId: integration.externalCompanyId,
      companyName: integration.companyName,
      integrationId: integration._id,
      actorUserId: user.userId || null,
      actorName: user.name || "",
      actorEmail: user.email || "",
      actorRole: user.role || "",
      message: `Revoked connection for ${integration.companyName}`,
    });

    const erpResult = await notifyErpDisconnect({
      connectionId: integration.integrationConnectionId,
      companyId: integration.externalCompanyId,
      externalConnectionId: integration._id,
      targetSystem: integration.targetSystem || INTEGRATION_TARGET,
      reason: "revoked_on_crm",
    });

    if (!erpResult.ok) {
      console.warn("[integrations/disconnect] ERP notify failed:", erpResult);
    } else {
      await IntegrationAudit.logIntegrationAudit({
        action: "revoked",
        provider: INTEGRATION_PROVIDER,
        externalCompanyId: integration.externalCompanyId,
        companyName: integration.companyName,
        integrationId: integration._id,
        actorUserId: user.userId || null,
        actorName: user.name || "",
        actorEmail: user.email || "",
        actorRole: user.role || "",
        message: "Notified ERP of CRM revoke",
        meta: { erpPath: erpResult.path },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: integration._id,
        status: integration.status,
        revokedAt: integration.revokedAt,
      },
      erpNotified: Boolean(erpResult.ok),
      erpNote: erpResult.ok
        ? "ERP connection revoked"
        : erpResult.error || "ERP was not notified — still shows Connected until ERP adds external-disconnect",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to disconnect integration" },
      { status: 500 }
    );
  }
}
