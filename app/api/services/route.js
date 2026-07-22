import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WebsiteModule from "@/lib/models/Website";
import { verifyAuth } from "@/lib/auth";

const Service = WebsiteModule.Service;

export async function GET(request) {
  const { response } = verifyAuth(request);
  if (response) return response;

  try {
    await connectDB();
    const services = await Service.find().sort({ name: 1 }).lean();
    return NextResponse.json(services);
  } catch (error) {
    console.error("Services fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
