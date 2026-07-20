const express = require("express");
const { z } = require("zod");
const User = require("../models/User");
const { signToken } = require("../middleware/auth");

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (!user || !(await user.comparePassword(parsed.data.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.json({ token });
});

module.exports = router;
