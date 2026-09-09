import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/auth";
import { USER_ROLES } from "@/lib/config";

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("A valid email is required").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  role: z.enum(USER_ROLES).default("viewer"),
  isActive: z.boolean().default(true),
});

export async function GET(request) {
  const { response, user: admin } = requireAdmin(request);
  if (response) return response;

  try {
    await connectDB();
    const users = await User.find({})
      .select("-passwordHash")
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json({
      users,
      me: {
        id: admin.userId || admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role || "admin",
      },
    });
  } catch (error) {
    console.error("Users list error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  const { response } = requireAdmin(request);
  if (response) return response;

  try {
    await connectDB();
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, role, isActive } = parsed.data;
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { error: `User with email "${email}" already exists` },
        { status: 409 }
      );
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role, isActive });

    const obj = user.toObject();
    delete obj.passwordHash;
    return NextResponse.json(obj, { status: 201 });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const first = Object.values(error.errors)[0];
      return NextResponse.json({ error: first?.message || "Validation failed" }, { status: 400 });
    }
    if (error?.code === 11000) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }
    console.error("User create error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}