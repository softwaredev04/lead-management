// Shared email templates used across all ClickMasters websites.
// Each template takes the lead + the website record and returns { subject, html, text }.
// The website name/domain is injected so the same template works for every site.

function baseLayout({ title, brand, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0d9488;padding:20px 24px;color:#ffffff;font-size:18px;font-weight:bold;">
          ${brand}
        </td></tr>
        <tr><td style="padding:24px;color:#18181b;font-size:15px;line-height:1.6;">
          ${body}
        </td></tr>
        <tr><td style="padding:16px 24px;background:#fafafa;color:#71717a;font-size:12px;border-top:1px solid #e4e4e7;">
          &copy; ${new Date().getFullYear()} ${brand}. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function fieldRow(label, value) {
  if (!value) return "";
  return `<p style="margin:4px 0;"><strong>${label}:</strong> ${value}</p>`;
}

// Email sent to the visitor (auto-reply / thank-you)
function visitorTemplate(lead, website) {
  const brand = website?.name || "ClickMasters";
  const body = `
    <h2 style="margin-top:0;">Thank you for reaching out!</h2>
    <p>Hi ${lead.name || "there"},</p>
    <p>We have received your message and a member of our team will get back to you shortly.</p>
    <p style="margin-top:16px;">Here is a copy of what you submitted:</p>
    ${fieldRow("Name", lead.name)}
    ${fieldRow("Email", lead.email)}
    ${fieldRow("Phone", lead.phone)}
    ${fieldRow("Company", lead.company)}
    ${fieldRow("Service", lead.service)}
    ${fieldRow("Message", lead.message)}
    <p style="margin-top:16px;color:#71717a;font-size:13px;">
      This email was sent from ${website?.name || "ClickMasters"} (${website?.domain || ""}).
    </p>
  `;
  return {
    subject: `We received your message — ${brand}`,
    html: baseLayout({ title: "Thank you", brand, body }),
    text: `Hi ${lead.name || "there"},\n\nWe received your message and will get back to you shortly.\n\nName: ${lead.name || ""}\nEmail: ${lead.email || ""}\nPhone: ${lead.phone || ""}\nService: ${lead.service || ""}\nMessage: ${lead.message || ""}`,
  };
}

// Email sent to the team (new lead notification)
function teamTemplate(lead, website) {
  const brand = website?.name || "ClickMasters";
  const body = `
    <h2 style="margin-top:0;">New lead from ${brand}</h2>
    ${fieldRow("Name", lead.name)}
    ${fieldRow("Email", lead.email)}
    ${fieldRow("Phone", lead.phone)}
    ${fieldRow("Company", lead.company)}
    ${fieldRow("Website", lead.website)}
    ${fieldRow("Service", lead.service)}
    ${fieldRow("Source", lead.source)}
    ${fieldRow("Landing Page", lead.landingPage)}
    ${fieldRow("Message", lead.message)}
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:16px 0;" />
    <p style="margin:4px 0;"><strong>UTM:</strong> ${[lead.utm?.source, lead.utm?.medium, lead.utm?.campaign].filter(Boolean).join(" / ") || "—"}</p>
    <p style="margin:4px 0;"><strong>IP:</strong> ${lead.ipAddress || "—"} <strong>Country:</strong> ${lead.country || "—"}</p>
    <p style="margin-top:16px;">
      <a href="${process.env.CLIENT_ORIGIN }/leads/${lead._id}" style="background:#0d9488;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;">View in Dashboard</a>
    </p>
  `;
  return {
    subject: `New lead: ${lead.name} — ${brand}`,
    html: baseLayout({ title: "New Lead", brand, body }),
    text: `New lead from ${brand}\nName: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone || ""}\nService: ${lead.service || ""}\nMessage: ${lead.message || ""}`,
  };
}

function assignmentTemplate(lead, assignee, actor) {
  const brand = "ClickMasters";
  const dashboardUrl = `${process.env.CLIENT_ORIGIN || "https://crm.clickmasters.pk"}/leads/${lead._id}`;
  const body = `
    <p style="margin:0 0 12px;">Hi ${assignee.name},</p>
    <p style="margin:0 0 16px;"><strong>${actor}</strong> assigned a lead to you. Please follow up soon.</p>
    ${fieldRow("Name", lead.name)}
    ${fieldRow("Email", lead.email)}
    ${fieldRow("Phone", lead.phone || "—")}
    ${fieldRow("Website", lead.website)}
    ${fieldRow("Service", lead.service || "—")}
    ${lead.message ? fieldRow("Message", String(lead.message).slice(0, 300)) : ""}
    <p style="margin-top:16px;">
      <a href="${dashboardUrl}" style="background:#0d9488;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;">Open Lead</a>
    </p>
  `;
  return {
    subject: `Lead assigned to you: ${lead.name}`,
    html: baseLayout({ title: "New Assignment", brand, body }),
    text: `A lead was assigned to you by ${actor}\nName: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone || ""}\nWebsite: ${lead.website}\nOpen: ${dashboardUrl}`,
  };
}

module.exports = { visitorTemplate, teamTemplate, assignmentTemplate };
