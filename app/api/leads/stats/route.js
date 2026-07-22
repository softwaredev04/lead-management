import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/lib/models/Lead";
import { verifyAuth } from "@/lib/auth";

export async function GET(request) {
  const { response } = verifyAuth(request);
  if (response) return response;

  try {
    await connectDB();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

    const [total, byStatus, today, thisMonth] = await Promise.all([
      Lead.countDocuments({}),
      Lead.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Lead.countDocuments({ createdAt: { $gte: startOfDay } }),
      Lead.countDocuments({ createdAt: { $gte: startOfMonth } }),
    ]);

    const statusMap = { New: 0, Contacted: 0, Closed: 0, Spam: 0 };
    for (const row of byStatus) statusMap[row._id] = row.count;

    return NextResponse.json({
      total,
      today,
      thisMonth,
      new: statusMap.New,
      contacted: statusMap.Contacted,
      closed: statusMap.Closed,
      spam: statusMap.Spam,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
