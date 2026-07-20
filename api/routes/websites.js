const express = require("express");
const { Website } = require("../models/Website");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (_req, res) => {
  const websites = await Website.find().sort({ name: 1 }).lean();
  res.json(websites);
});

module.exports = router;
