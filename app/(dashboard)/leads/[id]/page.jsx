"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const STATUSES = ["New", "Contacted", "Closed", "Spam"];

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  );
}

export default function LeadDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [services, setServices] = useState([]);
  const [websiteName, setWebsiteName] = useState("");
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [data, svc, sites] = await Promise.all([
          api.getLead(id),
          api.getServices(),
          api.getWebsites(),
        ]);
        setLead(data);
        setStatus(data.status);
        setService(data.service || "");
        setServices(svc.map((x) => x.name));
        const site = sites.find((w) => w.domain === data.website);
        setWebsiteName(site ? site.name : "");
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const notesArray = notes.trim()
        ? [{ text: notes.trim() }]
        : lead.notes || [];
      const updated = await api.updateLead(id, { status, service, notes: notesArray });
      setLead(updated);
      setNotes("");
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (error && !lead) return <p className="text-sm text-destructive">{error}</p>;
  if (!lead) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const utm = lead.utm || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/leads" className="text-sm text-primary hover:underline">
            ← Back to Leads
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{lead.name}</h1>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{lead.status}</span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lead info */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-base font-medium">Lead Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Email" value={lead.email} />
              <Field label="Phone" value={lead.phone} />
              <Field label="Company" value={lead.company} />
              <Field label="Website" value={websiteName ? `${websiteName} (${lead.website})` : lead.website} />
              <Field label="Landing Page" value={lead.landingPage} />
              <Field label="Service" value={lead.service} />
              <Field label="Source" value={lead.source} />
              <Field label="Referrer" value={lead.referrer} />
              <Field label="IP Address" value={lead.ipAddress} />
              <Field label="Country" value={lead.country} />
              <Field label="City" value={lead.city} />
              <Field label="Browser" value={lead.browser} />
              <Field label="OS" value={lead.os} />
              <Field label="Device" value={lead.deviceType} />
              <Field label="User Agent" value={lead.userAgent} />
              <Field label="Created" value={new Date(lead.createdAt).toLocaleString()} />
              <Field label="Updated" value={new Date(lead.updatedAt).toLocaleString()} />
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-base font-medium">UTM Parameters</h2>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Source" value={utm.source} />
              <Field label="Medium" value={utm.medium} />
              <Field label="Campaign" value={utm.campaign} />
              <Field label="Term" value={utm.term} />
              <Field label="Content" value={utm.content} />
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-base font-medium">Message</h2>
            <p className="whitespace-pre-wrap text-sm">{lead.message || "—"}</p>
          </section>
        </div>

        {/* Editable panel */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-base font-medium">Manage</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Service</label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"
                >
                  <option value="">—</option>
                  {services.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Add Note</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Internal note (private)…"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 w-full rounded-xl bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-base font-medium">Notes History</h2>
            {!lead.notes || lead.notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {lead.notes.map((n, i) => (
                  <li key={i} className="rounded-xl bg-muted p-3 text-sm">
                    <p>{n.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
