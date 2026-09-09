"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HealthBadge } from "@/components/ui/health-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Globe,
  Plus,
  Pencil,
  Trash2,
  Zap,
  RefreshCw,
  CircleCheck,
  CircleX,
  ExternalLink,
  Send,
  AlertTriangle,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

const inputCls =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

const EMPTY_FORM = { name: "", domain: "", status: "active" };

export default function WebsitesPage() {
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null); // website being edited (null = add)
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Connection checks
  const [checkingIds, setCheckingIds] = useState([]);
  const [bulkChecking, setBulkChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null); // dialog data

  const load = useCallback(async () => {
    try {
      const res = await api.getWebsiteStats();
      setStats(res.stats || []);
      setSummary(res.summary || null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // --- Add / Edit ---
  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(w) {
    setEditing(w);
    setForm({ name: w.name, domain: w.domain, status: w.status || "active" });
    setFormError("");
    setDialogOpen(true);
  }

  async function saveWebsite() {
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await api.updateWebsite(editing._id, form);
        toast.success("Website updated.");
      } else {
        await api.createWebsite(form);
        toast.success("Website added.");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // --- Delete ---
  async function confirmDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.deleteWebsite(deleteTarget._id);
      toast.success(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  // --- Connection checks ---
  async function checkConnection(w) {
    setCheckingIds((prev) => [...prev, w._id]);
    try {
      const res = await api.checkWebsite({ websiteId: w._id });
      setCheckResult({ websiteName: w.name, ...res });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCheckingIds((prev) => prev.filter((id) => id !== w._id));
    }
  }

  async function checkAllConnections() {
    setBulkChecking(true);
    let ok = 0;
    let failed = 0;
    for (const s of stats) {
      if (s.status !== "active") continue;
      setCheckingIds((prev) => [...prev, s._id]);
      try {
        const res = await api.checkWebsite({ websiteId: s._id });
        if (res.success) ok++;
        else failed++;
      } catch {
        failed++;
      }
      setCheckingIds((prev) => prev.filter((id) => id !== s._id));
    }
    setBulkChecking(false);
    if (ok + failed > 0) {
      toast.success(`Connection check finished — ${ok} passed, ${failed} failed.`);
    }
    load();
  }

  async function cleanupTestLeads() {
    try {
      const res = await api.cleanupTestLeads();
      toast.success(`${res.deleted ?? 0} test lead(s) removed.`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const isChecking = (id) => checkingIds.includes(id);
  const activeCount = stats.filter((s) => s.status === "active").length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Websites</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage connected sites and verify they are sending leads to the CRM.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-1 size-3" />
            Refresh
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1 size-3" />
            Add Website
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="mt-2 h-7 w-12 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Total Websites" value={summary?.total ?? 0} />
          <SummaryCard
            label="Connected (≤7d)"
            value={summary?.connected ?? 0}
            dot="bg-emerald-500"
            hint={`${summary?.active ?? 0} active · ${summary?.stale ?? 0} stale · ${summary?.dormant ?? 0} dormant`}
          />
          <SummaryCard
            label="Stale / Dormant"
            value={(summary?.stale ?? 0) + (summary?.dormant ?? 0)}
            dot="bg-amber-500"
            hint="No real leads in the last 8+ days"
          />
          <SummaryCard
            label="Never Connected"
            value={summary?.neverConnected ?? 0}
            dot="bg-muted-foreground/40"
            hint="No leads ever received"
          />
        </div>
      )}

      {/* Connection monitoring */}
      {!loading && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Connection Health</p>
                <p className="text-xs text-muted-foreground">
                  Send a test lead through the public API and verify it lands in the database.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cleanupTestLeads}
                title="Delete all test leads created by connection checks"
              >
                <Trash2 className="mr-1 size-3" />
                Clear Test Leads
              </Button>
              <Button
                size="sm"
                onClick={checkAllConnections}
                disabled={bulkChecking || activeCount === 0}
              >
                <Send className="mr-1 size-3" />
                {bulkChecking ? "Checking…" : "Check All Connections"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Websites table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Website</TableHead>
                <TableHead>Connection</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Last Lead</TableHead>
                <TableHead>Last Check</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
{/*__CHUNK3__*/}
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell>
                      <Skeleton className="h-4 w-48 rounded" />
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-5 w-24 rounded" /></TableCell>
                  </TableRow>
                ))
              ) : stats.length === 0 ? (
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="size-8 text-muted-foreground/40" />
                      <p className="font-medium">No websites found</p>
                      <p>Add websites to start receiving leads.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                stats.map((w) => (
                  <TableRow key={w._id} className="border-border transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Globe className="size-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{w.name}</p>
                          <a
                            href={`https://${w.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary"
                          >
                            {w.domain}
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <HealthBadge health={w.health} />
                        {w.status === "inactive" && (
                          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            marked inactive
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{w.totalLeads}</p>
                      <p className="text-xs text-muted-foreground">{w.last7Days} in last 7d</p>
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-muted-foreground"
                        title={w.lastLeadAt ? new Date(w.lastLeadAt).toLocaleString() : ""}
                      >
                        {w.lastLeadAt ? formatRelativeTime(w.lastLeadAt) : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {w.lastCheckedAt ? (
                          <>
                            <span
                              className={
                                w.lastCheckStatus === "success"
                                  ? "size-1.5 rounded-full bg-emerald-500"
                                  : "size-1.5 rounded-full bg-red-500"
                              }
                            />
                            <span className="text-muted-foreground">
                              {formatRelativeTime(w.lastCheckedAt)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/50 italic">never</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Send test lead to verify connection"
                          disabled={isChecking(w._id) || bulkChecking}
                          onClick={() => checkConnection(w)}
                        >
                          <Zap
                            className={`size-3.5 ${isChecking(w._id) ? "animate-pulse text-primary" : ""}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Edit website"
                          onClick={() => openEdit(w)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                          title="Delete website"
                          onClick={() => {
                            setDeleteTarget(w);
                            setDeleteError("");
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDialogOpen(false)}
          />
          <div className="animate-scale-in relative mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Globe className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">
                  {editing ? "Edit Website" : "Add Website"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {editing
                    ? "Update the website details below."
                    : "Register a website so its leads appear in the dashboard."}
                </p>
                <div className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="w-name">Name</Label>
                    <Input
                      id="w-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="ClickMasters Software"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="w-domain">Domain</Label>
                    <Input
                      id="w-domain"
                      value={form.domain}
                      onChange={(e) => setForm({ ...form, domain: e.target.value })}
                      placeholder="clickmasterssoftwaredevelopmentcompany.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Protocol and www are stripped automatically.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="w-status">Status</Label>
                    <select
                      id="w-status"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className={`${inputCls} w-full`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  {formError && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      {formError}
                    </div>
                  )}
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogOpen(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveWebsite}
                    disabled={saving || !form.name.trim() || !form.domain.trim()}
                  >
                    {saving ? "Saving…" : editing ? "Save Changes" : "Add Website"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="animate-scale-in relative mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">Delete Website</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-foreground">{deleteTarget.name}</span>?
                  This action cannot be undone.
                </p>
                {deleteError && (
                  <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {deleteError}
                  </div>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection check result dialog */}
      {checkResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCheckResult(null)}
          />
          <div className="animate-scale-in relative mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  checkResult.success ? "bg-emerald-500/10" : "bg-destructive/10"
                }`}
              >
                {checkResult.success ? (
                  <CircleCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <CircleX className="size-5 text-destructive" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">
                  {checkResult.success ? "Connection Verified" : "Connection Failed"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{checkResult.websiteName}</p>

                {checkResult.success ? (
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Latency</span>
                      <span className="font-medium text-foreground">{checkResult.latencyMs} ms</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Test lead ID</span>
                      <span
                        className="max-w-[180px] truncate font-mono text-xs text-foreground"
                        title={checkResult.leadId}
                      >
                        {checkResult.leadId}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Endpoint</span>
                      <p className="mt-0.5 break-all font-mono text-xs text-foreground">
                        {checkResult.endpoint}
                      </p>
                    </div>
                    <p className="pt-1 text-xs text-muted-foreground">
                      A test lead was submitted through the public API and verified in the
                      database. Emails were suppressed for the test.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      {checkResult.error}
                    </div>
                    {checkResult.detail && (
                      <p className="text-xs text-muted-foreground">{checkResult.detail}</p>
                    )}
                    <div>
                      <span className="text-muted-foreground">Endpoint</span>
                      <p className="mt-0.5 break-all font-mono text-xs text-foreground">
                        {checkResult.endpoint}
                      </p>
                    </div>
                    <p className="pt-1 text-xs text-muted-foreground">
                      Make sure the website&apos;s contact form posts to{" "}
                      <span className="font-mono">/api/leads</span> with a{" "}
                      <span className="font-mono">website</span> field matching this domain.
                    </p>
                  </div>
                )}

                <div className="mt-5 flex justify-end">
                  <Button size="sm" onClick={() => setCheckResult(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, dot, hint }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          {dot && <span className={`size-1.5 rounded-full ${dot}`} />}
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        </div>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground/70">{hint}</p>}
      </CardContent>
    </Card>
  );
}
