const mongoose = require("mongoose");

const integrationAuditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "authorize_viewed",
        "authorized",
        "confirm_failed",
        "cancelled",
        "revoked",
      ],
    },
    provider: { type: String, default: "clickmasters-erp" },
    requestId: { type: String, default: "", index: true },
    jti: { type: String, default: "" },
    externalCompanyId: { type: String, default: "" },
    companyName: { type: String, default: "" },
    integrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConnectedIntegration",
      default: null,
    },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorName: { type: String, default: "" },
    actorEmail: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    message: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

integrationAuditSchema.index({ createdAt: -1 });

const IntegrationAudit =
  mongoose.models.IntegrationAudit ||
  mongoose.model("IntegrationAudit", integrationAuditSchema);

async function logIntegrationAudit(entry) {
  try {
    await IntegrationAudit.create(entry);
  } catch (err) {
    console.error("[integration-audit] failed to write:", err.message);
  }
}

IntegrationAudit.logIntegrationAudit = logIntegrationAudit;

module.exports = IntegrationAudit;
module.exports.logIntegrationAudit = logIntegrationAudit;
