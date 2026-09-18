import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Lead from "@/lib/models/Lead";
import { requireErpIntegration } from "@/lib/services/integrationAuth";

const ALLOWED_SORT = new Set([
  "createdAt",
  "updatedAt",
  "name",
  "email",
  "status",
  "website",
  "service",
]);

/**
 * ERP → CRM scoped leads (Phase 3).
 * Auth: X-Integration-Secret + Ed25519 headers (see erpplan.md §0.1b).
 *
 * Single-tenant CRM: a verified active connection may read this CRM's
 * non-test leads. Multi-tenant lead partitioning is a later phase.
 */
export async function GET(request) {
  try {
    await connectDB();

    const { integration, response } = await requireErpIntegration(request, {
      requiredScope: "crm.leads.read",
    });
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    const sortField = ALLOWED_SORT.has(searchParams.get("sort"))
      ? searchParams.get("sort")
      : "createdAt";
    const sortDir = searchParams.get("order") === "asc" ? 1 : -1;

    // Real leads only — connection-check rows stay internal
    const filter = { isTest: { $ne: true } };

    if (searchParams.get("status")) filter.status = searchParams.get("status");
    if (searchParams.get("website")) filter.website = searchParams.get("website");
    if (searchParams.get("service")) filter.service = searchParams.get("service");

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(`${endDate}T23:59:59.999Z`);
      filter.createdAt = dateFilter;
    }

    const search = searchParams.get("search");
    const queryFilter = search
      ? { ...filter, $text: { $search: search } }
      : filter;

    const [leads, total] = await Promise.all([
      Lead.find(queryFilter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .select(
          "name email phone company message website landingPage service status assignee assigneeId source referrer utm country city createdAt updatedAt isDuplicate"
        )
        .lean(),
      Lead.countDocuments(queryFilter),
    ]);

    return NextResponse.json({
      data: leads,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      meta: {
        companyId: integration.externalCompanyId,
        companyName: integration.companyName,
        connectionId: integration.integrationConnectionId,
      },
    });
  } catch (err) {
    console.error("Integration leads GET error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
