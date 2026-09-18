import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import ConnectedIntegration from "@/lib/models/ConnectedIntegration";
import IntegrationAudit from "@/lib/models/IntegrationAudit";
import { INTEGRATION_PROVIDER } from "@/lib/config";

/**
 * Disconnect / revoke a ConnectedIntegration on CRM.
 * Phase 5 may also notify ERP; for v1 we stop trusting the link locally.
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

    return NextResponse.json({
      success: true,
      data: {
        id: integration._id,
        status: integration.status,
        revokedAt: integration.revokedAt,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to disconnect integration" },
      { status: 500 }
    );
  }
}
