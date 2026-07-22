require("dotenv").config({ path: require("path").resolve(__dirname, "../.env.local") });
if (!process.env.MONGODB_URI) {
  require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
}

const { connectDB } = require("../lib/db");
const mongoose = require("mongoose");

async function runSeed() {
  console.log("[seed] Connecting to database & seeding initial data...");
  await connectDB();
  console.log("[seed] Admin user, websites, and services seeded successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("[seed] Error during database seeding:", err);
  process.exit(1);
});
