const mongoose = require("mongoose");
const { DEFAULT_WEBSITES, SERVICES } = require("../config");

const websiteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    lastCheckedAt: { type: Date },
    lastCheckStatus: { type: String, enum: ["success", "failed"] },
  },
  { timestamps: true }
);

const Website = mongoose.models.Website || mongoose.model("Website", websiteSchema);

async function seedWebsites() {
  for (const w of DEFAULT_WEBSITES) {
    await Website.findOneAndUpdate({ domain: w.domain }, w, { upsert: true, returnDocument: "after" });
  }
  console.log(`[db] synced ${DEFAULT_WEBSITES.length} default websites (upsert, no duplicates)`);
}

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

const Service = mongoose.models.Service || mongoose.model("Service", serviceSchema);

async function seedServices() {
  for (const name of SERVICES) {
    await Service.findOneAndUpdate({ name }, { name }, { upsert: true, returnDocument: "after" });
  }
  console.log(`[db] synced ${SERVICES.length} default services (upsert, no duplicates)`);
}

module.exports = Website;
module.exports.Service = Service;
module.exports.seedWebsites = seedWebsites;
module.exports.seedServices = seedServices;
