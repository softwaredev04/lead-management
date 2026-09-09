import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

const updateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80).optional(),
  email: z.string().trim().email("A valid email is required").toLowerCase().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").max(100).optional(),
  role: z.enum(["admin", "viewer"]).optional(),
  isActive: z.boolean().optional(),
});

async function countOtherActiveAdmins(excludeId) {
  return User.countDocuments({
    role: "admin",
    isActive: true,
    _id: { $ne: excludeId },
  });
}

export async function GET(request, { params }) {
  const { response } = requireAdmin(request);
  if (response) return response;

  try {
    await connectDB();
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }
    const user = await User.findById(id).select("-passwordHash").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("User get error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { response, user: admin } = requireAdmin(request);
  if (response) return response;

  try {
    await connectDB();
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const target = await User.findById(id);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = parsed.data;
    const isSelf =
      (admin.userId || admin.id) === id || (admin.email && target.email === admin.email);

    // Email uniqueness
    if (data.email && data.email !== target.email) {
      const duplicate = await User.findOne({ email: data.email, _id: { $ne: id } }).lean();
      if (duplicate) {
        return NextResponse.json(
          { error: `User with email "${data.email}" already exists` },
          { status: 409 }
        );
      }
    }

    // Self-guard: never lock yourself out
    if (isSelf && (data.isActive === false || data.role === "viewer")) {
      return NextResponse.json(
        { error: "You cannot deactivate or demote your own account" },
        { status: 400 }
      );
    }

    // Last-admin guard: an active admin cannot lose admin rights if they are the last one
    const isActiveAdmin = target.role === "admin" && target.isActive !== false;
    const losingAdmin =
      isActiveAdmin &&
      ((data.role !== undefined && data.role !== "admin") || data.isActive === false);
    if (losingAdmin && (await countOtherActiveAdmins(target._id)) === 0) {
      return NextResponse.json(
        { error: "Cannot remove the last active admin account" },
        { status: 400 }
      );
    }

    if (data.name !== undefined) target.name = data.name;
    if (data.email !== undefined) target.email = data.email;
    if (data.role !== undefined) target.role = data.role;
    if (data.isActive !== undefined) target.isActive = data.isActive;
    if (data.password !== undefined) {
      target.passwordHash = await User.hashPassword(data.password);
    }

    await target.save();
    const obj = target.toObject();
    delete obj.passwordHash;
    return NextResponse.json(obj);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { response, user: admin } = requireAdmin(request);
  if (response) return response;

  try {
    await connectDB();
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }
    const target = await User.findById(id).lean();
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSelf =
      (admin.userId || admin.id) === id || (admin.email && target.email === admin.email);
    if (isSelf) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    if (target.role === "admin" && target.isActive !== false) {
      const otherAdmins = await countOtherActiveAdmins(target._id);
      if (otherAdmins === 0) {
        return NextResponse.json(
          { error: "Cannot delete the last active admin account" },
          { status: 400 }
        );
      }
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}