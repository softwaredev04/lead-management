const mongoose = require("mongoose");
const User = require("./models/User");
const { seedWebsites, seedServices } = require("./models/Website");

let isSeeded = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (mongoose.connection.readyState >= 1) {
    if (!isSeeded) {
      await seedAll();
    }
    return;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  await seedAll();
}

async function seedAll() {
  if (isSeeded) return;
  try {
    await User.seedAdmin();
    await seedWebsites();
    await seedServices();
    isSeeded = true;
  } catch (err) {
    console.error("[db] Seed failed:", err);
  }
}

module.exports = { connectDB };
