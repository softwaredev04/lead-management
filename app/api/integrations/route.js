import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import ConnectedIntegration from "@/lib/models/ConnectedIntegration";

/** List connected integrations (active + revoked for history). */
export async function GET(request) {
  const { response } = requireAuth(request);
  if (response) return response;

  try {
    await connectDB();
    const integrations = await ConnectedIntegration.find({})
      .sort({ connectedAt: -1 })
      .select("-publicKey")
      .lean();

    return NextResponse.json({
      data: integrations.map((row) => ({
        id: row._id,
        provider: row.provider,
        companyName: row.companyName,
        externalCompanyId: row.externalCompanyId,
        scopes: row.scopes || [],
        status: row.status,
        connectedAt: row.connectedAt,
        revokedAt: row.revokedAt,
        connectedByName: row.connectedByName,
        connectedByEmail: row.connectedByEmail,
        keyId: row.keyId,
        targetSystem: row.targetSystem,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to list integrations" },
      { status: 500 }
    );
  }
}
