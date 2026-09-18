import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Lead from "@/lib/models/Lead";
import { verifyAuth, requireRole, requireAdmin } from "@/lib/auth";
import User from "@/lib/models/User";
import { WRITE_ROLES } from "@/lib/config";
import { LEAD_STATUSES, SERVICES } from "@/lib/config";
import { notifyAssignment } from "@/lib/services/email";

export async function GET(request, { params }) {
  const { response } = verifyAuth(request);
  if (response) return response;

  try {
    await connectDB();
    const { id } = await params;
    const lead = await Lead.findById(id).lean();
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(lead);
  } catch (error) {
    console.error("Lead getById error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const editSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  service: z.enum(SERVICES).optional(),
  notes: z.array(z.object({ text: z.string().min(1) })).optional(),
  newNote: z.string().min(1).optional(),
  assignee: z.string().optional(), // legacy plain-string assignment
  assigneeId: z.string().nullable().optional(), // real user assignment
  closedReason: z.string().optional(),
  dealValue: z.number().min(0).optional(),
});

export async function PUT(request, { params }) {
  const { user, response } = requireRole(request, WRITE_ROLES);
  if (response) return response;

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const parsed = editSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await Lead.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const { status, service, notes, newNote, assignee, assigneeId, closedReason, dealValue } = parsed.data;
    const actor = user?.name || user?.email || "System";
    const actorId = user?.id || null;
    const activities = [];
    let newlyAssignedUser = null;
    let hasActivity = false;

    if (status !== undefined && status !== existing.status) {
      activities.push({
        type: "status",
        message: `Status changed from ${existing.status} to ${status}`,
        actor,
        actorId,
      });
      existing.status = status;
      hasActivity = true;
    }

    if (closedReason !== undefined && closedReason !== existing.closedReason) {
      existing.closedReason = closedReason;
      hasActivity = true;
    }

    if (dealValue !== undefined && dealValue !== existing.dealValue) {
      existing.dealValue = dealValue;
      hasActivity = true;
    }

    if (service !== undefined && service !== existing.service) {
      activities.push({
        type: "service",
        message: `Service changed${existing.service ? ` from ${existing.service}` : ""} to ${service}`,
        actor,
        actorId,
      });
      existing.service = service;
      hasActivity = true;
    }

    if (assigneeId !== undefined) {
      if (assigneeId === null || assigneeId === "") {
        if (existing.assigneeId || existing.assignee) {
          activities.push({
            type: "assignee",
            message: `Unassigned from ${existing.assignee || "previous assignee"}`,
            actor,
            actorId,
          });
          hasActivity = true;
        }
        existing.assigneeId = null;
        existing.assignee = "";
      } else {
        const assignedUser = await User.findById(assigneeId).lean();
        if (!assignedUser) {
          return NextResponse.json({ error: "Invalid assignee — user not found" }, { status: 400 });
        }
        if (String(existing.assigneeId || "") !== String(assignedUser._id)) {
          activities.push({
            type: "assignee",
            message: `Assigned to ${assignedUser.name}`,
            actor,
            actorId,
          });
          hasActivity = true;
        }
        existing.assigneeId = assignedUser._id;
        existing.assignee = assignedUser.name;
        newlyAssignedUser = assignedUser;
      }
    } else if (assignee !== undefined && assignee !== existing.assignee) {
      activities.push({
        type: "assignee",
        message: assignee ? `Assigned to ${assignee}` : "Unassigned",
        actor,
        actorId,
      });
      existing.assignee = assignee;
      hasActivity = true;
    }

    if (newNote) {
      existing.notes.push({ text: newNote, createdAt: new Date(), updatedAt: new Date() });
      const preview = newNote.length > 80 ? `${newNote.slice(0, 80)}…` : newNote;
      activities.push({ type: "note", message: `Added a note: "${preview}"`, actor, actorId });
      hasActivity = true;
    }

    if (notes !== undefined) {
      existing.notes = notes.map((n) => ({
        text: n.text,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    if (!Array.isArray(existing.activities)) existing.activities = [];
    if (activities.length) existing.activities.push(...activities);

    // Update lastActivityAt whenever anything meaningful changed
    if (hasActivity) existing.lastActivityAt = new Date();

    // Recalculate lead score (schema fields may have changed)
    existing.leadScore = Lead.calculateScore(existing);

    await existing.save();

    // Assignment email (fire-and-forget — never blocks or fails the request)
    if (newlyAssignedUser) {
      notifyAssignment(existing._id, newlyAssignedUser._id, actor).catch(() => {});
    }

    return NextResponse.json(existing);
  } catch (error) {
    console.error("Lead update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { response } = requireAdmin(request);
  if (response) return response;

  try {
    await connectDB();
    const { id } = await params;
    const result = await Lead.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
