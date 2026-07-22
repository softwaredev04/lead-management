import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Lead from "@/lib/models/Lead";
import { verifyAuth } from "@/lib/auth";
import { LEAD_STATUSES, SERVICES } from "@/lib/config";

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
});

export async function PUT(request, { params }) {
  const { response } = verifyAuth(request);
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

    const { status, service, notes } = parsed.data;
    if (status !== undefined) existing.status = status;
    if (service !== undefined) existing.service = service;
    if (notes !== undefined) {
      existing.notes = notes.map((n) => ({
        text: n.text,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    await existing.save();
    return NextResponse.json(existing);
  } catch (error) {
    console.error("Lead update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { response } = verifyAuth(request);
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
