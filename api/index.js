require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { connectDB } = require("./db");
const { errorHandler, notFound } = require("./middleware/error");
const leadsRouter = require("./routes/leads");
const authRouter = require("./routes/auth");
const websitesRouter = require("./routes/websites");
const servicesRouter = require("./routes/services");
const User = require("./models/User");
const { seedWebsites, seedServices } = require("./models/Website");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/websites", websitesRouter);
app.use("/api/services", servicesRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  await connectDB();
  await User.seedAdmin();
  await seedWebsites();
  await seedServices();
  app.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("[api] failed to start", err);
  process.exit(1);
});
