import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Website from "@/lib/models/Website";
import { verifyAuth, requireRole } from "@/lib/auth";
import { WRITE_ROLES } from "@/lib/config";
import { normalizeDomain } from "@/lib/config";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(request) {
  const { response } = verifyAuth(request);
  if (response) return response;

  try {
    await connectDB();
    const websites = await Website.find().sort({ name: 1 }).lean();
    return NextResponse.json(websites);
  } catch (error) {
    console.error("Websites fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const createWebsiteSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  domain: z.string().trim().min(1, "Domain is required"),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function POST(request) {
  const { response } = requireRole(request, WRITE_ROLES);
  if (response) return response;

  try {
    await connectDB();
    const body = await request.json();
    const parsed = createWebsiteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders }
      );
    }

    const domain = normalizeDomain(parsed.data.domain);
    if (!domain) {
      return NextResponse.json(
        { error: "A valid domain (e.g. example.com) is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const existing = await Website.findOne({ domain }).lean();
    if (existing) {
      return NextResponse.json(
        { error: `Website with domain "${domain}" already exists` },
        { status: 409, headers: corsHeaders }
      );
    }

    const website = await Website.create({
      name: parsed.data.name,
      domain,
      status: parsed.data.status || "active",
    });
    return NextResponse.json(website, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("Website create error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
