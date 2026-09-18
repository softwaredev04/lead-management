import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import ConnectedIntegration from "@/lib/models/ConnectedIntegration";
import IntegrationAudit from "@/lib/models/IntegrationAudit";
import { INTEGRATION_PROVIDER } from "@/lib/config";

function timingSafeEqualString(a, b) {
  const aa = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

const bodySchema = z.object({
  status: z.enum(["revoked", "active"]),
  connectionId: z.string().min(1).optional(),
  companyId: z.string().min(1).optional(),
  externalConnectionId: z.string().optional(),
  reason: z.string().optional(),
  targetSystem: z.string().optional(),
});

/**
 * ERP → CRM status sync (server-to-server).
 * When ERP disconnects in Project Connectors, it should POST here so CRM
 * Connected Apps flips to Revoked in near real-time (with live poll / later sockets).
 *
 * POST /api/integrations/webhook/status
 * Header: X-Integration-Secret
 */
export async function POST(request) {
  const secret = process.env.INTEGRATION_CONFIRM_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INTEGRATION_CONFIRM_SECRET is not configured" },
      { status: 503 }
    );
  }

  const header = request.headers.get("x-integration-secret");
  if (!header || !timingSafeEqualString(header, secret)) {
    return NextResponse.json(
      { error: "Unauthorized integration webhook" },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, connectionId, companyId, externalConnectionId, reason } =
    parsed.data;

  if (!connectionId && !companyId && !externalConnectionId) {
    return NextResponse.json(
      {
        error:
          "Provide connectionId and/or companyId (and optional externalConnectionId)",
      },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const query = { provider: INTEGRATION_PROVIDER };
    if (externalConnectionId) {
      query._id = externalConnectionId;
    } else {
      const or = [];
      if (connectionId) or.push({ integrationConnectionId: connectionId });
      if (companyId) or.push({ externalCompanyId: companyId, status: "active" });
      query.$or = or;
    }

    const integration = await ConnectedIntegration.findOne(query).sort({
      connectedAt: -1,
    });

    if (!integration) {
      return NextResponse.json(
        { error: "No matching ConnectedIntegration on CRM" },
        { status: 404 }
      );
    }

    if (status === "revoked") {
      if (integration.status !== "revoked") {
        integration.status = "revoked";
        integration.revokedAt = new Date();
        await integration.save();

        await IntegrationAudit.logIntegrationAudit({
          action: "revoked",
          provider: INTEGRATION_PROVIDER,
          externalCompanyId: integration.externalCompanyId,
          companyName: integration.companyName,
          integrationId: integration._id,
          message: reason || "Revoked via ERP webhook",
          meta: { source: "erp_webhook", connectionId, companyId },
        });
      }
    } else if (status === "active") {
      integration.status = "active";
      integration.revokedAt = null;
      integration.connectedAt = integration.connectedAt || new Date();
      await integration.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        id: integration._id,
        status: integration.status,
        revokedAt: integration.revokedAt,
        companyName: integration.companyName,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Webhook failed" },
      { status: 500 }
    );
  }
}
