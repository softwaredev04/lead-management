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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatRelativeTime, formatFullDate } from "@/lib/utils";
import {
  ArrowLeft,
  Save,
  Globe,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink,
  Clock,
  Mail,
  Phone,
  Building2,
  Send,
  Inbox,
  UserRound,
} from "lucide-react";

const STATUSES = ["New", "Contacted", "Closed", "Spam"];

function Field({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 break-words text-sm text-foreground">
          {value || "—"}
        </dd>
      </div>
    </div>
  );
}

function FieldInline({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-sm text-foreground">
        {value || "—"}
      </dd>
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
  const [assignee, setAssignee] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

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
        setAssignee(data.assignee || "");
        setServices(svc.map((x) => x.name));
        const site = sites.find((w) => w.domain === data.website);
        setWebsiteName(site ? site.name : "");
      } catch (err) {
        toast.error(err.message);
      }
    }
    load();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const notesArray = notes.trim() ? [{ text: notes.trim() }] : lead.notes || [];
      const updated = await api.updateLead(id, { status, service, assignee, notes: notesArray });
      setLead(updated);
      setNotes("");
      toast.success("Changes saved successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (!lead)
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-32 rounded-lg" />
        <Skeleton className="h-8 w-64 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );

  const utm = lead.utm || {};
  const deviceIcon = lead.deviceType === "mobile" ? Smartphone
    : lead.deviceType === "tablet" ? Tablet
    : Monitor;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Leads
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {lead.name}
            </h1>
            <StatusBadge status={lead.status} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Email" value={lead.email} icon={Mail} />
                <Field label="Phone" value={lead.phone} icon={Phone} />
                <Field label="Company" value={lead.company} icon={Building2} />
                <Field label="Website" value={websiteName ? `${websiteName}` : lead.website} icon={Globe} />
                {websiteName && (
                  <Field label="Domain" value={lead.website} />
                )}
                <Field label="Landing Page" value={lead.landingPage} icon={ExternalLink} />
                <Field label="Service" value={lead.service} />
                <Field label="Source" value={lead.source} />
                <Field label="Referrer" value={lead.referrer} />
              </div>
            </CardContent>
          </Card>

          {/* Message */}
          <Card>
            <CardHeader>
              <CardTitle>Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                  {lead.message || "No message provided."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="IP Address" value={lead.ipAddress} icon={Globe} />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Location
                    </dt>
                    <dd className="mt-0.5 text-sm text-foreground">
                      {[lead.city, lead.country].filter(Boolean).join(", ") || "—"}
                    </dd>
                  </div>
                </div>
                <Field label="Device" value={lead.deviceType} icon={deviceIcon} />
                <FieldInline label="Browser" value={lead.browser} />
                <FieldInline label="OS" value={lead.os} />
                <FieldInline label="User Agent" value={lead.userAgent} />
              </div>
            </CardContent>
          </Card>

          {/* UTM Parameters */}
          {utm.source || utm.medium || utm.campaign || utm.term || utm.content ? (
            <Card>
              <CardHeader>
                <CardTitle>UTM Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FieldInline label="Source" value={utm.source} />
                  <FieldInline label="Medium" value={utm.medium} />
                  <FieldInline label="Campaign" value={utm.campaign} />
                  <FieldInline label="Term" value={utm.term} />
                  <FieldInline label="Content" value={utm.content} />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right Column - Manage Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
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
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <option value="">—</option>
                  {services.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assignee">Assignee</Label>
                <input
                  id="assignee"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Person responsible…"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Add Note</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Internal note (private)…"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="mr-1.5 size-4" />
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* Email Notification Log */}
          {(lead.emails && lead.emails.length > 0) ? (
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...lead.emails].reverse().map((email, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        {email.type === "visitor_reply" ? (
                          <Send className="size-4 text-primary" />
                        ) : (
                          <Inbox className="size-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {email.type === "visitor_reply" ? "Auto-Reply to Visitor" : "Team Notification"}
                        </p>
                        <p className="mt-0.5 text-sm text-foreground">{email.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          To: {email.to} — {formatRelativeTime(email.sentAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Timeline / Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes History</CardTitle>
            </CardHeader>
            <CardContent>
              {!lead.notes || lead.notes.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Clock className="size-6 text-muted-foreground/40" />
                  <p>No notes yet.</p>
                </div>
              ) : (
                <div className="relative space-y-4">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-2 h-[calc(100%-16px)] w-px bg-border" />
                  {[...lead.notes].reverse().map((n, i) => (
                    <div key={i} className="relative flex gap-3">
                      <div className="relative z-10 mt-1.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                        <div className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
                      </div>
                      <div className="min-w-0 flex-1 rounded-lg bg-muted/50 p-3">
                        <p className="text-sm text-foreground">{n.text}</p>
                        <p className="mt-1 text-xs text-muted-foreground" title={formatFullDate(n.createdAt)}>
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Creation Info */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-foreground">Created</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFullDate(lead.createdAt)}
                  </p>
                </div>
              </div>
              {lead.updatedAt !== lead.createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-foreground">Last Updated</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(lead.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
