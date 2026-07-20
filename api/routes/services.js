const express = require("express");
const WebsiteModule = require("../models/Website");
const Service = WebsiteModule.Service;
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (_req, res) => {
  const services = await Service.find().sort({ name: 1 }).lean();
  res.json(services);
});

module.exports = router;
