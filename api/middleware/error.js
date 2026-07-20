const { ZodError } = require("zod");

function notFound(_req, res) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error("[api] error:", err);
  res.status(500).json({ error: message });
}

module.exports = { notFound, errorHandler };
