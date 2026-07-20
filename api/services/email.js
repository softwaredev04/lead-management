const nodemailer = require("nodemailer");
const { Website } = require("../models/Website");
const { visitorTemplate, teamTemplate } = require("./emailTemplates");

let transporter;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

async function notifyNewLead(lead) {
  const website = await Website.findOne({ domain: lead.website }).lean().catch(() => null);
  const from = process.env.SMTP_FROM || process.env.NOTIFY_TO || "no-reply@clickmasters.com";

  const t = getTransporter();
  if (!t) {
    console.log(
      `[api] new lead (no SMTP configured): ${lead.name} <${lead.email}> via ${lead.website}`
    );
    return;
  }

  try {
    // 1) Auto-reply to the visitor
    if (lead.email) {
      const v = visitorTemplate(lead, website);
      await t.sendMail({ from, to: lead.email, subject: v.subject, text: v.text, html: v.html });
    }

    // 2) Notification to the team
    const teamTo = process.env.NOTIFY_TO;
    if (teamTo) {
      const tm = teamTemplate(lead, website);
      await t.sendMail({ from, to: teamTo, subject: tm.subject, text: tm.text, html: tm.html });
    }
  } catch (err) {
    console.error("[api] email send failed:", err.message);
  }
}

module.exports = { notifyNewLead };
