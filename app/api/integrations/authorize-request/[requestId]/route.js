import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { fetchAuthorizeRequest } from "@/lib/services/erpIntegration";
import IntegrationAudit from "@/lib/models/IntegrationAudit";

export async function GET(request, { params }) {
  const { user, response } = requireAuth(request);
  if (response) return response;

  const { requestId } = await params;
  if (!requestId || !/^[a-f0-9]{16,128}$/i.test(requestId)) {
    return NextResponse.json(
      { error: "Invalid authorization request id" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const meta = await fetchAuthorizeRequest(requestId);

    IntegrationAudit.logIntegrationAudit({
      action: "authorize_viewed",
      requestId: meta.requestId,
      jti: meta.jti,
      externalCompanyId: meta.companyId,
      companyName: meta.companyName,
      actorUserId: user.userId || null,
      actorName: user.name || "",
      actorEmail: user.email || "",
      actorRole: user.role || "",
      message: `Viewed consent for ${meta.companyName}`,
      meta: { targetSystem: meta.targetSystem, scopes: meta.scopes },
    });

    return NextResponse.json({ data: meta });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load authorization request" },
      { status }
    );
  }
}
