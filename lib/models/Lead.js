const mongoose = require("mongoose");
const { LEAD_STATUSES, SERVICES, LEAD_SCORING } = require("../config");

// A lead with no assignee and still "New" after this many days is "overdue"
const OVERDUE_DAYS = 7;

// Same email (or email+phone) arriving within this window counts as a duplicate
const DUPLICATE_WINDOW_HOURS = 24;

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
  },
  { timestamps: true }
);

// Activity timeline entries (who did what, when)
const activitySchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // created | status | service | assignee | note | bulk_status | bulk_assign
    message: { type: String, required: true },
    actor: { type: String, default: "System" }, // display name
    actorId: { type: String, default: null }, // user id (when done by a logged-in user)
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    message: { type: String },
    website: { type: String, required: true, trim: true },
    landingPage: { type: String },
    service: { type: String, enum: SERVICES },
    source: { type: String },
    status: { type: String, enum: LEAD_STATUSES, default: "New" },
    referrer: { type: String },
    utm: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String,
    },
    ipAddress: { type: String },
    country: { type: String },
    city: { type: String },
    browser: { type: String },
    os: { type: String },
    deviceType: { type: String },
    userAgent: { type: String },
    notes: { type: [noteSchema], default: [] },
    isTest: { type: Boolean, default: false },
    isDuplicate: { type: Boolean, default: false },
    assignee: { type: String, default: "" }, // denormalized display name
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // --- Tier 1: Sales pipeline fields ---
    leadScore: { type: Number, default: 0, index: true },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    closedReason: { type: String, trim: true, default: "" },
    dealValue: { type: Number, default: 0 },
    activities: { type: [activitySchema], default: [] },
    emails: [
      {
        type: { type: String, enum: ["visitor_reply", "team_notice"], required: true },
        to: { type: String, required: true },
        subject: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

leadSchema.index({ website: 1, status: 1, createdAt: -1 });
leadSchema.index({ assigneeId: 1 });
leadSchema.index({ name: "text", email: "text", phone: "text", company: "text", message: "text" });
leadSchema.index({ email: 1, phone: 1, createdAt: -1 });
leadSchema.index({ leadScore: -1 });
leadSchema.index({ lastActivityAt: 1 });

// Auto-score a lead based on data completeness, source quality, and recency.
// Returns a 0-100 integer.  Score = how "rich" and actionable the lead is.
leadSchema.statics.calculateScore = function (lead) {
  let score = 0;
  if (lead.email) score += LEAD_SCORING.hasEmail;
  if (lead.phone) score += LEAD_SCORING.hasPhone;
  if (lead.company) score += LEAD_SCORING.hasCompany;
  if (lead.message) score += LEAD_SCORING.hasMessage;
  if (lead.utm?.source) score += LEAD_SCORING.hasUtmSource;
  if (lead.utm?.campaign) score += LEAD_SCORING.hasUtmCampaign;
  if (lead.service) score += LEAD_SCORING.hasService;

  // Recency bonus: full at <1 day, linear decay to 0 at 30 days
  const ageDays = (Date.now() - new Date(lead.createdAt || Date.now()).getTime()) / (24 * 60 * 60 * 1000);
  const recencyBonus = Math.max(0, LEAD_SCORING.recencyMaxBonus * (1 - ageDays / 30));
  score += Math.round(recencyBonus);

  return Math.min(100, score);
};

// Find the most recent lead matching the same email (or email+phone) within the
// duplicate window. Returns the matched lead, or null. Used to flag repeat
// submissions from the same person/company so the team can spot duplicates.
leadSchema.statics.findDuplicate = async function (data) {
  const since = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000);
  const email = (data.email || "").trim().toLowerCase();
  const phone = (data.phone || "").trim();

  if (!email && !phone) return null;

  // Match: same email; OR same phone (if provided) within the window.
  const conditions = [];
  if (email) conditions.push({ email });
  if (phone) conditions.push({ phone });
  if (conditions.length === 0) return null;

  const match = await this.findOne({
    _id: { $ne: data._id },
    isTest: { $ne: true },
    createdAt: { $gte: since },
    $or: conditions,
  }).lean();

  return match;
};

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
module.exports = Lead;
