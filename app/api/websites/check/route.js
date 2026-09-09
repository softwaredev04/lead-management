import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Website from "@/lib/models/Website";
import Lead from "@/lib/models/Lead";
import { verifyAuth } from "@/lib/auth";

// Simulates an external website submitting a lead through the public
// POST /api/leads endpoint, then verifies the lead actually landed in the
// database. Test leads are flagged isTest and skip email notifications.
export async function POST(request) {
  const { response } = verifyAuth(request);
  if (response) return response;

  try {
    await connectDB();
    const body = await request.json();

    const schema = z.object({
      websiteId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid websiteId"),
      endpoint: z.string().trim().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const website = await Website.findById(parsed.data.websiteId).lean();
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const origin = new URL(request.url).origin;
    const endpoint = parsed.data.endpoint || `${origin}/api/leads`;
    const started = Date.now();

    const payload = {
      name: "Connection Test",
      email: "test@connection-check.clickmasters",
      phone: "+00 000 0000000",
      company: website.name,
      website: website.domain,
      service: "Digital Marketing",
      message: `Automated connection test from CRM for ${website.domain}. Safe to delete.`,
      landingPage: `https://${website.domain}/crm-connection-test`,
      referrer: origin,
      utm_source: "crm",
      utm_medium: "connection-check",
      utm_campaign: "api-health-test",
      isTest: true,
    };

    let step = "request";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      step = "verify";
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        await markFailed(website._id);
        return NextResponse.json(
          {
            success: false,
            error: `Endpoint responded with HTTP ${res.status}`,
            detail: errText.slice(0, 300),
            endpoint,
          },
          { status: 200 }
        );
      }

      const created = await res.json().catch(() => null);
      const leadId = created && created._id ? created._id : null;

      step = "verify";
      // Confirm the lead really persisted (works for any endpoint writing
      // to this database; if the remote returns an id, match on it first)
      const verifyQuery = leadId
        ? { _id: leadId, isTest: true }
        : {
            email: payload.email,
            website: website.domain,
            createdAt: { $gte: new Date(started - 5000) },
          };
      const verified = await Lead.findOne(verifyQuery).lean();

      const latencyMs = Date.now() - started;
      if (!verified) {
        await markFailed(website._id);
        return NextResponse.json(
          {
            success: false,
            error: "Lead was not found in the database after submission",
            detail:
              "The endpoint responded, but no test lead was persisted. It may point to a different database or reject the payload.",
            endpoint,
          },
          { status: 200 }
        );
      }

      await Website.updateOne(
        { _id: website._id },
        { lastCheckedAt: new Date(), lastCheckStatus: "success" }
      );
      return NextResponse.json({
        success: true,
        leadId: String(verified._id),
        latencyMs,
        endpoint,
        message: "Test lead submitted and verified in database.",
      });
    } catch (err) {
      await markFailed(website._id);
      const reason =
        err && err.name === "TimeoutError"
          ? "Request timed out after 15s"
          : (err && err.message) || "Network error";
      return NextResponse.json(
        { success: false, error: reason, detail: `Failed at step: ${step}`, endpoint },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Website connection check error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function markFailed(websiteId) {
  await Website.updateOne(
    { _id: websiteId },
    { lastCheckedAt: new Date(), lastCheckStatus: "failed" }
  ).catch(() => {});
}

// Bulk cleanup of test leads created by connection checks
export async function DELETE(request) {
  const { response } = verifyAuth(request);
  if (response) return response;

  try {
    await connectDB();
    const result = await Lead.deleteMany({ isTest: true });
    return NextResponse.json({
      success: true,
      deleted: result.deletedCount || 0,
    });
  } catch (error) {
    console.error("Test leads cleanup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}