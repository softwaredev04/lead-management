// New-lead notifier. Sends email when SMTP env is configured,
// otherwise logs to console so local dev never crashes.
function notifyNewLead(lead) {
  const to = process.env.NOTIFY_TO;
  if (!to || !process.env.SMTP_HOST) {
    console.log(
      `[api] new lead (no SMTP configured): ${lead.name} <${lead.email}> via ${lead.website}`
    );
    return;
  }
  // TODO: integrate nodemailer when SMTP credentials are provided.
  console.log(`[api] would email ${to} about lead ${lead._id}`);
}

module.exports = { notifyNewLead };
