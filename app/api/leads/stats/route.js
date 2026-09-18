import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/lib/models/Lead";
import { verifyAuth } from "@/lib/auth";
import { OVERDUE_DAYS, FOLLOWUP_REMINDER_DAYS } from "@/lib/config";

export async function GET(request) {
  const { user, response } = verifyAuth(request);
  if (response) return response;

  try {
    await connectDB();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
    const overdueBefore = new Date(Date.now() - OVERDUE_DAYS * 24 * 60 * 60 * 1000);
    const followUpBefore = new Date(Date.now() - FOLLOWUP_REMINDER_DAYS * 24 * 60 * 60 * 1000);

    const OPEN_STATUSES = ["New", "Contacted"];
    const CLOSED_STATUSES = ["Closed Won", "Closed Lost"];
    const OPEN_FILTER = { status: { $in: OPEN_STATUSES } };

    const [total, byStatus, today, thisMonth, myLeads, unassigned, overdue, workload, followUpDue, avgScore] =
      await Promise.all([
        Lead.countDocuments({}),
        Lead.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Lead.countDocuments({ createdAt: { $gte: startOfDay } }),
        Lead.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Lead.countDocuments({ ...OPEN_FILTER, assigneeId: user.userId || user.id || user._id }),
        Lead.countDocuments({ ...OPEN_FILTER, assigneeId: null }),
        Lead.countDocuments({
          assigneeId: null,
          status: "New",
          isTest: { $ne: true },
          createdAt: { $lt: overdueBefore },
        }),
        Lead.aggregate([
          { $match: { ...OPEN_FILTER, assigneeId: { $ne: null } } },
          { $group: { _id: "$assignee", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),
        // Follow-up due: assigned, open, and last activity older than FOLLOWUP_REMINDER_DAYS
        Lead.countDocuments({
          assigneeId: { $ne: null },
          status: { $in: OPEN_STATUSES },
          lastActivityAt: { $lt: followUpBefore },
        }),
        // Average lead score across all non-test leads
        Lead.aggregate([
          { $match: { isTest: { $ne: true } } },
          { $group: { _id: null, avg: { $avg: "$leadScore" } } },
        ]),
      ]);

    const statusMap = { New: 0, Contacted: 0, "Closed Won": 0, "Closed Lost": 0, Spam: 0 };
    for (const row of byStatus) statusMap[row._id] = row.count;

    // Handle legacy "Closed" status from before Tier 1 (treat as Closed Won for backward compat)
    const legacyClosed = byStatus.find((r) => r._id === "Closed");
    if (legacyClosed) statusMap["Closed Won"] += legacyClosed.count;

    const totalClosed = statusMap["Closed Won"] + statusMap["Closed Lost"];
    const totalForConversion = total - statusMap.Spam;
    const conversionRate = totalForConversion > 0 ? Math.round((statusMap["Closed Won"] / totalForConversion) * 100) : 0;

    return NextResponse.json({
      total,
      today,
      thisMonth,
      new: statusMap.New,
      contacted: statusMap.Contacted,
      closedWon: statusMap["Closed Won"],
      closedLost: statusMap["Closed Lost"],
      spam: statusMap.Spam,
      myLeads,
      unassigned,
      overdue,
      followUpDue,
      conversionRate,
      avgLeadScore: avgScore[0]?.avg ? Math.round(avgScore[0].avg) : 0,
      workload: workload.map((w) => ({ name: w._id || "Unassigned", count: w.count })),
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
