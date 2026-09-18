const mongoose = require("mongoose");

const connectedIntegrationSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true,
      default: "clickmasters-erp",
      index: true,
    },
    // ERP company that connected
    externalCompanyId: { type: String, required: true, trim: true, index: true },
    companyName: { type: String, default: "", trim: true },
    // ERP IntegrationConnection._id
    integrationConnectionId: { type: String, required: true, trim: true },
    publicKey: { type: String, required: true },
    keyId: { type: String, default: "", trim: true },
    certificateFingerprint: { type: String, default: "", trim: true },
    scopes: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
      index: true,
    },
    connectedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    connectedByName: { type: String, default: "" },
    connectedByEmail: { type: String, default: "" },
    // Handshake metadata (for audit / replay detection)
    requestId: { type: String, default: "", index: true },
    jti: { type: String, default: "" },
    targetSystem: { type: String, default: "lead-crm" },
    connectedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
    revokedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

connectedIntegrationSchema.index(
  { provider: 1, integrationConnectionId: 1 },
  { unique: true }
);
connectedIntegrationSchema.index(
  { provider: 1, externalCompanyId: 1, status: 1 }
);

const ConnectedIntegration =
  mongoose.models.ConnectedIntegration ||
  mongoose.model("ConnectedIntegration", connectedIntegrationSchema);

module.exports = ConnectedIntegration;
