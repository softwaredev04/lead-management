import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/lib/models/Lead";
import { verifyAuth } from "@/lib/auth";

export async function GET(request) {
  const { response } = verifyAuth(request);
  if (response) return response;

  try {
    await connectDB();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [daily, byWebsite, byService] = await Promise.all([
      Lead.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Lead.aggregate([{ $group: { _id: "$website", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Lead.aggregate([
        { $match: { service: { $exists: true, $ne: null } } },
        { $group: { _id: "$service", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return NextResponse.json({
      daily: daily.map((d) => ({ date: d._id, count: d.count })),
      byWebsite: byWebsite.map((d) => ({ website: d._id, count: d.count })),
      byService: byService.map((d) => ({ service: d._id, count: d.count })),
    });
  } catch (error) {
    console.error("Charts fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
