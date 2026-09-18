import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Lead from "@/lib/models/Lead";
import User from "@/lib/models/User";
import { requireRole, requireAdmin } from "@/lib/auth";
import { WRITE_ROLES, LEAD_STATUSES } from "@/lib/config";
import { notifyAssignment } from "@/lib/services/email";

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Select at least one lead"),
  action: z.enum(["status", "assign", "unassign", "delete"]),
  status: z.enum(LEAD_STATUSES).optional(),
  assigneeId: z.string().optional(),
});

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  // Deleting leads stays admin-only, other bulk actions need write roles
  const guard = body.action === "delete" ? requireAdmin(request) : requireRole(request, WRITE_ROLES);
  const { user, response } = guard;
  if (response) return response;

  try {
    await connectDB();
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { ids, action, status, assigneeId } = parsed.data;
    const actor = user?.name || user?.email || "System";
    const actorId = user?.id || null;
    const filter = { _id: { $in: ids } };
    let modified = 0;

    if (action === "delete") {
      const result = await Lead.deleteMany(filter);
      return NextResponse.json({ success: true, deleted: result.deletedCount });
    }

    if (action === "status") {
      const result = await Lead.updateMany(filter, {
        $set: { status },
        $push: {
          activities: {
            type: "bulk_status",
            message: `Status changed to ${status} (bulk action)`,
            actor,
            actorId,
          },
        },
      });
      modified = result.modifiedCount;
    } else if (action === "unassign") {
      const result = await Lead.updateMany(
        { ...filter, $or: [{ assigneeId: { $ne: null } }, { assignee: { $ne: "" } }] },
        {
          $set: { assigneeId: null, assignee: "" },
          $push: {
            activities: { type: "bulk_assign", message: "Unassigned (bulk action)", actor, actorId },
          },
        }
      );
      modified = result.modifiedCount;
    } else if (action === "assign") {
      const assignedUser = await User.findById(assigneeId).lean();
      if (!assignedUser) {
        return NextResponse.json({ error: "Invalid assignee — user not found" }, { status: 400 });
      }
      // Capture affected leads first (for assignment emails) — only ones changing assignee
      const affected = await Lead.find({ ...filter, assigneeId: { $ne: assignedUser._id } })
        .select("_id")
        .lean();
      const result = await Lead.updateMany(
        { ...filter, assigneeId: { $ne: assignedUser._id } },
        {
          $set: { assigneeId: assignedUser._id, assignee: assignedUser.name },
          $push: {
            activities: {
              type: "bulk_assign",
              message: `Assigned to ${assignedUser.name} (bulk action)`,
              actor,
              actorId,
            },
          },
        }
      );
      modified = result.modifiedCount;
      // One assignment email per affected lead (capped to avoid mail storms)
      for (const doc of affected.slice(0, 10)) {
        notifyAssignment(doc._id, assignedUser._id, actor).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, modified });
  } catch (error) {
    console.error("Bulk leads error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
