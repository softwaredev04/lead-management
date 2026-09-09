import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Website from "@/lib/models/Website";
import Lead from "@/lib/models/Lead";
import { verifyAuth } from "@/lib/auth";

// Per-website lead statistics + connection health classification.
// Health is derived from how recently REAL (non-test) leads arrived:
//   connected  — lead received within the last 7 days
//   stale      — last lead 8-30 days ago
//   dormant    — last lead more than 30 days ago
//   never      — no leads ever received from this website
export async function GET(request) {
  const { response } = verifyAuth(request);
  if (response) return response;

  try {
    await connectDB();

    const now = Date.now();
    const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [websites, pipelineResult] = await Promise.all([
      Website.find().sort({ name: 1 }).lean(),
      Lead.aggregate([
        { $match: { isTest: { $ne: true } } },
        {
          $group: {
            _id: "$website",
            total: { $sum: 1 },
            newCount: {
              $sum: { $cond: [{ $eq: ["$status", "New"] }, 1, 0] },
            },
            lastLeadAt: { $max: "$createdAt" },
            last7: {
              $sum: {
                $cond: [{ $gte: ["$createdAt", d7] }, 1, 0],
              },
            },
            last30: {
              $sum: {
                $cond: [{ $gte: ["$createdAt", d30] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const statsByDomain = {};
    for (const row of pipelineResult) statsByDomain[row._id] = row;

    const healthRank = { connected: 0, stale: 1, dormant: 2, never: 3 };
    const stats = websites.map((w) => {
      const s = statsByDomain[w.domain] || {};
      const total = s.total || 0;
      const lastLeadAt = s.lastLeadAt || null;

      let health = "never";
      if (lastLeadAt) {
        const days = (now - new Date(lastLeadAt).getTime()) / 86400000;
        if (days <= 7) health = "connected";
        else if (days <= 30) health = "stale";
        else health = "dormant";
      }
      if (w.status === "inactive") health = w.status; // inactive websites report their own status

      return {
        _id: w._id,
        name: w.name,
        domain: w.domain,
        status: w.status || "active",
        lastCheckedAt: w.lastCheckedAt || null,
        lastCheckStatus: w.lastCheckStatus || null,
        totalLeads: total,
        newLeads: s.newCount || 0,
        last7Days: s.last7 || 0,
        last30Days: s.last30 || 0,
        lastLeadAt,
        health,
      };
    });

    const active = stats.filter((s) => s.status === "active");
    const summary = {
      total: stats.length,
      active: active.length,
      connected: stats.filter((s) => s.health === "connected").length,
      stale: stats.filter((s) => s.health === "stale").length,
      dormant: stats.filter((s) => s.health === "dormant").length,
      neverConnected: stats.filter((s) => s.health === "never").length,
      bestRank: active.length
        ? healthRank[
            active.reduce((best, s) =>
              healthRank[s.health] < healthRank[best.health] ? s : best
            ).health
          ]
        : 3,
    };

    return NextResponse.json({ stats, summary });
  } catch (error) {
    console.error("Website stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}