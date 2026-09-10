import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Website from "@/lib/models/Website";
import Lead from "@/lib/models/Lead";
import { verifyAuth, requireRole } from "@/lib/auth";
import { WRITE_ROLES } from "@/lib/config";
import { normalizeDomain } from "@/lib/config";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export async function PUT(request, { params }) {
  const { response } = requireRole(request, WRITE_ROLES);
  if (response) return response;

  try {
    await connectDB();
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid website id" }, { status: 400 });
    }
    const body = await request.json();

    const editSchema = z.object({
      name: z.string().trim().min(1, "Name is required").optional(),
      domain: z.string().trim().min(1, "Domain is required").optional(),
      status: z.enum(["active", "inactive"]).optional(),
    });
    const parsed = editSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await Website.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if (parsed.data.domain !== undefined) {
      const domain = normalizeDomain(parsed.data.domain);
      if (!domain) {
        return NextResponse.json(
          { error: "A valid domain (e.g. example.com) is required" },
          { status: 400 }
        );
      }
      const duplicate = await Website.findOne({
        domain,
        _id: { $ne: id },
      }).lean();
      if (duplicate) {
        return NextResponse.json(
          { error: `Website with domain "${domain}" already exists` },
          { status: 409 }
        );
      }
      existing.domain = domain;
    }
    if (parsed.data.name !== undefined) existing.name = parsed.data.name;
    if (parsed.data.status !== undefined) existing.status = parsed.data.status;

    await existing.save();
    return NextResponse.json(existing);
  } catch (error) {
    console.error("Website update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { response } = requireRole(request, WRITE_ROLES);
  if (response) return response;

  try {
    await connectDB();
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid website id" }, { status: 400 });
    }
    const website = await Website.findById(id).lean();
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Check for leads associated with this website
    const leadCount = await Lead.countDocuments({ website: website.domain });
    if (leadCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete "${website.name}" — ${leadCount} lead${leadCount === 1 ? "" : "s"} exist for this website. Reassign or delete those leads first.`,
        },
        { status: 409 }
      );
    }

    await Website.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Website delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}