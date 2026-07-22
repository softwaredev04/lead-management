import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Lead from "@/lib/models/Lead";
import { verifyAuth } from "@/lib/auth";
import { captureDeviceInfo } from "@/lib/services/geo";
import { notifyNewLead } from "@/lib/services/email";
import { SERVICES } from "@/lib/config";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().optional(),
  website: z.string().min(1),
  landingPage: z.string().optional(),
  service: z.enum(SERVICES).optional(),
  source: z.string().optional(),
  referrer: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
});

export async function GET(request) {
  const { response } = verifyAuth(request);
  if (response) return response;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (searchParams.get("status")) filter.status = searchParams.get("status");
    if (searchParams.get("website")) filter.website = searchParams.get("website");
    if (searchParams.get("service")) filter.service = searchParams.get("service");

    const sortField = searchParams.get("sort") || "createdAt";
    const sortDir = searchParams.get("order") === "asc" ? 1 : -1;

    const search = searchParams.get("search");
    let query = Lead.find(filter);
    if (search) {
      query = Lead.find({ ...filter, $text: { $search: search } });
    }

    const [leads, total] = await Promise.all([
      query.sort({ [sortField]: sortDir }).skip(skip).limit(limit).lean(),
      Lead.countDocuments(filter),
    ]);

    return NextResponse.json({ data: leads, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Leads GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const device = captureDeviceInfo(request);

    const lead = await Lead.create({
      ...data,
      utm: {
        source: data.utm_source,
        medium: data.utm_medium,
        campaign: data.utm_campaign,
        term: data.utm_term,
        content: data.utm_content,
      },
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
      browser: device.browser,
      os: device.os,
      deviceType: device.deviceType,
    });

    notifyNewLead(lead);
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Lead create error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
