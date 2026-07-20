const express = require("express");
const { z } = require("zod");
const Lead = require("../models/Lead");
const { requireAuth } = require("../middleware/auth");
const { captureDeviceInfo } = require("../services/geo");
const { notifyNewLead } = require("../services/email");
const { LEAD_STATUSES, SERVICES } = require("../config");

const router = express.Router();

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

// GET /api/leads — getAll (search, pagination, sort, filter)
router.get("/", requireAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.website) filter.website = req.query.website;
  if (req.query.service) filter.service = req.query.service;

  const sortField = req.query.sort || "createdAt";
  const sortDir = req.query.order === "asc" ? 1 : -1;

  const search = req.query.search;
  let query = Lead.find(filter);
  if (search) {
    query = Lead.find({ ...filter, $text: { $search: search } });
  }

  const [leads, total] = await Promise.all([
    query.sort({ [sortField]: sortDir }).skip(skip).limit(limit).lean(),
    Lead.countDocuments(filter),
  ]);

  res.json({ data: leads, page, limit, total, totalPages: Math.ceil(total / limit) });
});

// GET /api/leads/:id — getById
router.get("/:id", requireAuth, async (req, res) => {
  const lead = await Lead.findById(req.params.id).lean();
  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }
  res.json(lead);
});

// POST /api/leads — create (public, from websites)
router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }
  const data = parsed.data;
  const device = captureDeviceInfo(req);

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
  res.status(201).json(lead);
});

// PUT /api/leads/:id — editById (only status, notes, service)
const editSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  service: z.enum(SERVICES).optional(),
  notes: z.array(z.object({ text: z.string().min(1) })).optional(),
});

router.put("/:id", requireAuth, async (req, res) => {
  const parsed = editSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }

  const existing = await Lead.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Lead not found" });
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
  res.json(existing);
});

// DELETE /api/leads/:id — deleteById
router.delete("/:id", requireAuth, async (req, res) => {
  const result = await Lead.findByIdAndDelete(req.params.id);
  if (!result) {
    return res.status(404).json({ error: "Lead not found" });
  }
  res.json({ success: true });
});

module.exports = router;
