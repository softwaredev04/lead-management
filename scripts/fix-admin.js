require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../lib/models/User");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const email = String(process.env.ADMIN_EMAIL).toLowerCase().trim();

  // Repair the admin account (role may be missing on docs created before roles existed)
  const res = await User.updateOne(
    { email },
    { $set: { role: "admin", isActive: true } }
  );
  console.log(`[fix] admin matched=${res.matchedCount} modified=${res.modifiedCount}`);

  // Ensure the admin has a display name (legacy docs may have none)
  await User.updateOne(
    { email, name: { $in: [null, ""] } },
    { $set: { name: "Administrator" } }
  );

  // Remove test users created during validation
  const del = await User.deleteMany({
    email: { $in: [
      "roletest.viewer@test.com",
      "roletest.norole@test.com",
      "rolecheck@clickmasters.com",
      "norole@clickmasters.com",
    ] },
  });
  console.log(`[fix] removed ${del.deletedCount} test user(s)`);

  const all = await User.find({}).select("email role isActive").lean();
  all.forEach((u) => console.log(` - ${u.email} role=${u.role || "(none)"} active=${u.isActive !== false}`));
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });