const nodemailer = require("nodemailer");
const Website = require("../models/Website");
const Lead = require("../models/Lead");
const User = require("../models/User");
const { visitorTemplate, teamTemplate, assignmentTemplate } = require("./emailTemplates");

let transporter;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass }
        : undefined,
    });
  }
  return transporter;
}

async function notifyNewLead(lead) {
  const website = await Website.findOne({ domain: lead.website }).lean().catch(() => null);
  const from = process.env.SMTP_FROM || process.env.NOTIFY_TO || "no-reply@clickmasters.com";
  const user = process.env.SMTP_USER;

  const t = getTransporter();
  if (!t) {
    console.log(
      `[db] new lead (no SMTP configured): ${lead.name} <${lead.email}> via ${lead.website}`
    );
    return;
  }

  console.log(`[db] sending emails via ${process.env.SMTP_HOST} as ${user}`);

  try {
    if (lead.email) {
      const v = visitorTemplate(lead, website);
      await t.sendMail({ from, to: lead.email, subject: v.subject, text: v.text, html: v.html });
      // Log visitor reply
      await Lead.findByIdAndUpdate(lead._id, {
        $push: {
          emails: {
            type: "visitor_reply",
            to: lead.email,
            subject: v.subject,
            sentAt: new Date(),
          },
        },
      });
    }

    const teamTo = process.env.NOTIFY_TO;
    if (teamTo) {
      const tm = teamTemplate(lead, website);
      await t.sendMail({ from, to: teamTo, subject: tm.subject, text: tm.text, html: tm.html });
      // Log team notice
      await Lead.findByIdAndUpdate(lead._id, {
        $push: {
          emails: {
            type: "team_notice",
            to: teamTo,
            subject: tm.subject,
            sentAt: new Date(),
          },
        },
      });
    }
    console.log("[db] emails sent successfully");
  } catch (err) {
    console.error(`[db] email send failed (as ${user}):`, err.message);
  }
}

// Notify an assignee (by user id) that a lead was assigned to them.
// Fire-and-forget safe: never throws, logs to lead.emails.
async function notifyAssignment(leadId, assigneeUserId, actorName) {
  try {
    const t = getTransporter();
    if (!t) return;
    const [lead, assignee] = await Promise.all([
      Lead.findById(leadId).lean(),
      User.findById(assigneeUserId).lean(),
    ]);
    if (!lead || !assignee || !assignee.email) return;
    if (assignee.isActive === false) return;

    const from = process.env.SMTP_FROM || process.env.NOTIFY_TO || "no-reply@clickmasters.com";
    const tpl = assignmentTemplate(lead, assignee, actorName || "A teammate");
    await t.sendMail({
      from,
      to: assignee.email,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
    });
    await Lead.findByIdAndUpdate(leadId, {
      $push: {
        emails: {
          type: "assignment",
          to: assignee.email,
          subject: tpl.subject,
          sentAt: new Date(),
        },
      },
    });
    console.log(`[db] assignment email sent to ${assignee.email}`);
  } catch (err) {
    console.error("[db] assignment email failed:", err.message);
  }
}

module.exports = { notifyNewLead, notifyAssignment };
