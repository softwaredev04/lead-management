const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "sales_agent", "team_lead", "manager", "viewer"],
      default: "viewer",
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const emailLc = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: emailLc });

  if (existing) {
    // Keep the admin account valid even if it was created before roles existed
    // or was edited later: ensure role=admin and it stays active.
    if (existing.role !== "admin" || existing.isActive === false) {
      await User.updateOne(
        { _id: existing._id },
        { $set: { role: "admin", isActive: true } }
      );
      console.log(`[db] repaired admin account: ${emailLc}`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    name: "Administrator",
    email: emailLc,
    passwordHash,
    role: "admin",
  });
  console.log(`[db] seeded admin: ${emailLc}`);
}

module.exports = User;
module.exports.seedAdmin = seedAdmin;
