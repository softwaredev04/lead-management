"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  const fieldCls = "space-y-1.5";
  const inputCls =
    "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Contact Form Preview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This mirrors what a ClickMasters website sends to{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
            POST /api/leads
          </code>
          . Submitting creates a real lead and triggers both emails.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Form fields</h2>

          <div className={fieldCls}>
            <Label>Name</Label>
            <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          <div className={fieldCls}>
            <Label>Email</Label>
            <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>

          <div className={fieldCls}>
            <Label>Phone</Label>
            <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>

          <div className={fieldCls}>
            <Label>Company</Label>
            <input className={inputCls} value={form.company} onChange={(e) => set("company", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={fieldCls}>
              <Label>Website</Label>
              <select className={inputCls} value={form.website} onChange={(e) => set("website", e.target.value)}>
                {WEBSITES.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div className={fieldCls}>
              <Label>Service</Label>
              <select className={inputCls} value={form.service} onChange={(e) => set("service", e.target.value)}>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={fieldCls}>
            <Label>Message</Label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
            />
          </div>

          <div className={fieldCls}>
            <Label>Landing Page</Label>
            <input className={inputCls} value={form.landingPage} onChange={(e) => set("landingPage", e.target.value)} />
          </div>

          <div className={fieldCls}>
            <Label>Referrer</Label>
            <input className={inputCls} value={form.referrer} onChange={(e) => set("referrer", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={fieldCls}>
              <Label>utm_source</Label>
              <input className={inputCls} value={form.utm_source} onChange={(e) => set("utm_source", e.target.value)} />
            </div>
            <div className={fieldCls}>
              <Label>utm_medium</Label>
              <input className={inputCls} value={form.utm_medium} onChange={(e) => set("utm_medium", e.target.value)} />
            </div>
            <div className={fieldCls}>
              <Label>utm_campaign</Label>
              <input className={inputCls} value={form.utm_campaign} onChange={(e) => set("utm_campaign", e.target.value)} />
            </div>
            <div className={fieldCls}>
              <Label>utm_term</Label>
              <input className={inputCls} value={form.utm_term} onChange={(e) => set("utm_term", e.target.value)} />
            </div>
            <div className={fieldCls}>
              <Label>utm_content</Label>
              <input className={inputCls} value={form.utm_content} onChange={(e) => set("utm_content", e.target.value)} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting…" : "Submit Lead (live)"}
          </Button>

          {error && (
            <p className="animate-fade-in rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {result && (
            <p className="animate-fade-in rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              Lead created ({result._id.slice(0, 8)}...). Both emails triggered.
            </p>
          )}
        </form>

        {/* Mapping table */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Field → Email mapping
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Field</th>
                  <th className="py-2 pr-4 font-medium">Visitor email</th>
                  <th className="py-2 font-medium">Team email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MAPPING.map((m) => (
                  <tr key={m.field}>
                    <td className="py-2.5 pr-4 font-mono text-xs text-foreground">
                      {m.field}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {m.visitor}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{m.team}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Branding (header/footer) comes from the <strong>Website</strong> matching the submitted
            domain. Auto-captured fields (IP, country, browser, OS, device) are added by the server
            and appear in the team email.
          </p>
        </div>
      </div>
    </div>
  );
}
