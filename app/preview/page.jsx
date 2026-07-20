"use client";

import { useState } from "react";
import { api } from "@/lib/api";

const WEBSITES = [
  "clickmastersdigitalmarketing.com",
  "clickmasterssoftwaredevelopmentcompany.com",
  "clickmastersmobiledevelopmentcompany.com",
  "clickmastersblockchaintechnologies.com",
  "clickmasterswebdevelopmentcompany.com",
  "clickmastersartificialintelligencecompany.com",
  "clickmastersapplicationdevelopment.com",
  "clickmastersaiautomation.com",
  "clickmasterssoftwaredevelopmentcompany.co.uk",
  "clickmastersartificialintelligencecompany.co.uk",
];

const SERVICES = [
  "Software Development",
  "Web Development",
  "Mobile App Development",
  "Artificial Intelligence",
  "Blockchain",
  "Digital Marketing",
  "Automation",
];

// Field → where it appears in each email template
const MAPPING = [
  { field: "name", visitor: "Shown (greeting + copy)", team: "Shown" },
  { field: "email", visitor: "Sent TO (auto-reply)", team: "Shown" },
  { field: "phone", visitor: "Copy of submission", team: "Shown" },
  { field: "company", visitor: "Copy of submission", team: "Shown" },
  { field: "website", visitor: "Branding (from Websites)", team: "Shown" },
  { field: "service", visitor: "Copy of submission", team: "Shown" },
  { field: "message", visitor: "Copy of submission", team: "Shown" },
  { field: "source", visitor: "—", team: "Shown" },
  { field: "landingPage", visitor: "—", team: "Shown" },
  { field: "referrer", visitor: "—", team: "— (not in template)" },
  { field: "utm_source", visitor: "—", team: "Shown (UTM line)" },
  { field: "utm_medium", visitor: "—", team: "Shown (UTM line)" },
  { field: "utm_campaign", visitor: "—", team: "Shown (UTM line)" },
  { field: "utm_term", visitor: "—", team: "— (not in template)" },
  { field: "utm_content", visitor: "—", team: "— (not in template)" },
  { field: "ipAddress", visitor: "—", team: "Shown" },
  { field: "country", visitor: "—", team: "Shown" },
];

const inputCls =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export default function PreviewPage() {
  const [form, setForm] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "+44 20 1234 5678",
    company: "Acme Ltd",
    website: WEBSITES[1],
    service: SERVICES[0],
    message: "Need an AI chatbot for our support site.",
    landingPage: "https://clickmasterssoftwaredevelopmentcompany.com/contact",
    referrer: "https://google.com/",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "summer_sale",
    utm_term: "software company",
    utm_content: "header_button",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const created = await api.createLead(form);
      setResult(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contact Form Preview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This mirrors what a ClickMasters website sends to <code>POST /api/leads</code>. Submitting
          creates a real lead and triggers both emails.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-medium">Form fields</h2>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Phone</label>
            <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Company</label>
            <input className={inputCls} value={form.company} onChange={(e) => set("company", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Website</label>
            <select className={inputCls} value={form.website} onChange={(e) => set("website", e.target.value)}>
              {WEBSITES.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Service</label>
            <select className={inputCls} value={form.service} onChange={(e) => set("service", e.target.value)}>
              {SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Message</label>
            <textarea rows={3} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none" value={form.message} onChange={(e) => set("message", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Landing Page</label>
            <input className={inputCls} value={form.landingPage} onChange={(e) => set("landingPage", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Referrer</label>
            <input className={inputCls} value={form.referrer} onChange={(e) => set("referrer", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">utm_source</label>
              <input className={inputCls} value={form.utm_source} onChange={(e) => set("utm_source", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">utm_medium</label>
              <input className={inputCls} value={form.utm_medium} onChange={(e) => set("utm_medium", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">utm_campaign</label>
              <input className={inputCls} value={form.utm_campaign} onChange={(e) => set("utm_campaign", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">utm_term</label>
              <input className={inputCls} value={form.utm_term} onChange={(e) => set("utm_term", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">utm_content</label>
              <input className={inputCls} value={form.utm_content} onChange={(e) => set("utm_content", e.target.value)} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-xl bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit Lead (live)"}
          </button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {result && (
            <p className="text-sm text-emerald-600">
              Lead created ({result._id}). Both emails triggered.
            </p>
          )}
        </form>

        {/* Mapping */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-base font-medium">Field → Email mapping</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Field</th>
                  <th className="py-2 pr-3 font-medium">Visitor email</th>
                  <th className="py-2 font-medium">Team email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MAPPING.map((m) => (
                  <tr key={m.field}>
                    <td className="py-2 pr-3 font-mono text-xs">{m.field}</td>
                    <td className="py-2 pr-3">{m.visitor}</td>
                    <td className="py-2">{m.team}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Branding (header/footer) comes from the <strong>Website</strong> matching the submitted
            domain. Auto-captured fields (IP, country, browser, OS, device) are added by the server
            and appear in the team email.
          </p>
        </div>
      </div>
    </div>
  );
}
