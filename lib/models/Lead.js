const mongoose = require("mongoose");
const { LEAD_STATUSES, SERVICES } = require("../config");

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
  },
  { timestamps: true }
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
    assignee: { type: String, default: "" },
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
leadSchema.index({ name: "text", email: "text", phone: "text", company: "text", message: "text" });

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
module.exports = Lead;
