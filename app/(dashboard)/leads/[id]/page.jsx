"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUSES = ["New", "Contacted", "Closed", "Spam"];

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm">{value || "—"}</dd>
    </div>
  );
}

export default function LeadDetailsPage() {
  const { id } = useParams();
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
      const notesArray = notes.trim() ? [{ text: notes.trim() }] : lead.notes || [];
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

  if (error && !lead)
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );

  if (!lead)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-4xl" />
        <Skeleton className="h-64 rounded-4xl" />
      </div>
    );

  const utm = lead.utm || {};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/leads" className="text-sm text-primary hover:underline">
            ← Back to Leads
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{lead.name}</h1>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {saved && <p className="text-sm text-emerald-600">Changes saved.</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>UTM Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Source" value={utm.source} />
                <Field label="Medium" value={utm.medium} />
                <Field label="Campaign" value={utm.campaign} />
                <Field label="Term" value={utm.term} />
                <Field label="Content" value={utm.content} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap break-words text-sm">{lead.message || "—"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-9 w-full rounded-3xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="service">Service</Label>
                <select
                  id="service"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="h-9 w-full rounded-3xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
                >
                  <option value="">—</option>
                  {services.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Add Note</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Internal note (private)…"
                  className="w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 w-full rounded-3xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes History</CardTitle>
            </CardHeader>
            <CardContent>
              {!lead.notes || lead.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                <ul className="space-y-3">
                  {lead.notes.map((n, i) => (
                    <li key={i} className="rounded-3xl bg-muted p-3 text-sm">
                      <p>{n.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
