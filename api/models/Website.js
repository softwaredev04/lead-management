const mongoose = require("mongoose");
const { DEFAULT_WEBSITES, SERVICES } = require("../config");

const websiteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

const Website = mongoose.model("Website", websiteSchema);

async function seedWebsites() {
  for (const w of DEFAULT_WEBSITES) {
    await Website.findOneAndUpdate({ domain: w.domain }, w, { upsert: true, returnDocument: "after" });
  }
  console.log(`[api] seeded ${DEFAULT_WEBSITES.length} websites`);
}

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

const Service = mongoose.model("Service", serviceSchema);

async function seedServices() {
  for (const name of SERVICES) {
    await Service.findOneAndUpdate({ name }, { name }, { upsert: true, returnDocument: "after" });
  }
  console.log(`[api] seeded ${SERVICES.length} services`);
}

module.exports = Website;
module.exports.Service = Service;
module.exports.seedWebsites = seedWebsites;
module.exports.seedServices = seedServices;
