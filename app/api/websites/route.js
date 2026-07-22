import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Website from "@/lib/models/Website";
import { verifyAuth } from "@/lib/auth";

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
