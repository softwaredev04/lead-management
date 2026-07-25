"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Search,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Download,
  Columns3,
  Bookmark,
  Save,
  CalendarDays,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";

const ALL_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "service", label: "Service" },
  { key: "status", label: "Status" },
  { key: "assignee", label: "Assignee" },
  { key: "createdAt", label: "Created" },
];

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [website, setWebsite] = useState("");
  const [service, setService] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [websites, setWebsites] = useState([]);
  const [services, setServices] = useState([]);
  const [websiteMap, setWebsiteMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Date range
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Saved views (localStorage)
  const [savedViews, setSavedViews] = useState([]);
  const [viewName, setViewName] = useState("");
  const [showSavedViews, setShowSavedViews] = useState(false);
  const savedViewsRef = useRef(null);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState(
    ALL_COLUMNS.map((c) => c.key)
  );
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target))
        setColumnMenuOpen(false);
      if (savedViewsRef.current && !savedViewsRef.current.contains(e.target))
        setShowSavedViews(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Escape key to close delete dialog
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape" && deleteTarget) {
        closeDeleteDialog();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [deleteTarget]);

  // Load saved views from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("savedViews");
      if (raw) setSavedViews(JSON.parse(raw));
    } catch {}
  }, []);

  function saveCurrentView() {
    if (!viewName.trim()) return;
    const view = {
      id: Date.now().toString(),
      name: viewName.trim(),
      search,
      status,
      website,
      service,
      startDate,
      endDate,
    };
    const updated = [...savedViews, view];
    setSavedViews(updated);
    localStorage.setItem("savedViews", JSON.stringify(updated));
    setViewName("");
    setShowSavedViews(false);
    toast.success(`View "${view.name}" saved.`);
  }

  function loadView(view) {
    setSearch(view.search || "");
    setSearchInput(view.search || "");
    setStatus(view.status || "");
    setWebsite(view.website || "");
    setService(view.service || "");
    setStartDate(view.startDate || "");
    setEndDate(view.endDate || "");
    setPage(1);
    setShowSavedViews(false);
  }

  function deleteView(id) {
    const updated = savedViews.filter((v) => v.id !== id);
    setSavedViews(updated);
    localStorage.setItem("savedViews", JSON.stringify(updated));
  }

  const selectCls =
    "h-9 min-w-[140px] rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

  const loadFilters = useCallback(async () => {
    try {
      const [w, s] = await Promise.all([api.getWebsites(), api.getServices()]);
      setWebsites(w);
      setServices(s.map((x) => x.name));
      const map = {};
      for (const site of w) map[site.domain] = site.name;
      setWebsiteMap(map);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, sort, order };
      if (search) params.search = search;
      if (status) params.status = status;
      if (website) params.website = website;
      if (service) params.service = service;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.getLeads(params);
      setLeads(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, website, service, startDate, endDate, sort, order]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  function handleSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  function handleSearchKey(e) {
    if (e.key === "Enter") handleSearch();
  }

  function toggleSort(key) {
    if (sort === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(key);
      setOrder("desc");
    }
    setPage(1);
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setWebsite("");
    setService("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  function hasActiveFilters() {
    return search || status || website || service || startDate || endDate;
  }

  // --- CSV Export ---
  function exportCSV() {
    try {
      const headers = ALL_COLUMNS.map((c) => c.label);
      const rows = leads.map((lead) =>
        ALL_COLUMNS.map((col) => {
          const val = lead[col.key];
          if (col.key === "createdAt") return new Date(val).toLocaleString();
          if (col.key === "website") return websiteMap[val] || val;
          return val ?? "";
        })
      );
      const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${leads.length} leads.`);
    } catch (err) {
      toast.error("Failed to export CSV.");
    }
  }

  // --- Delete handlers ---
  function openDeleteDialog(lead, e) {
    e.stopPropagation();
    setDeleteTarget(lead);
    setDeleteError("");
  }

  function closeDeleteDialog() {
    setDeleteTarget(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.deleteLead(deleteTarget._id);
      toast.success(`"${deleteTarget.name}" was deleted.`);
      closeDeleteDialog();
      if (leads.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        loadLeads();
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete lead.");
    } finally {
      setDeleting(false);
    }
  }

  function toggleColumn(key) {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  // --- Bulk Selection ---
  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l._id));
    }
  }

  function exportSelected() {
    const selectedLeads = leads.filter((l) => selectedIds.includes(l._id));
    if (selectedLeads.length === 0) {
      toast.error("No leads selected.");
      return;
    }
    try {
      const headers = ALL_COLUMNS.map((c) => c.label);
      const rows = selectedLeads.map((lead) =>
        ALL_COLUMNS.map((col) => {
          const val = lead[col.key];
          if (col.key === "createdAt") return new Date(val).toLocaleString();
          if (col.key === "website") return websiteMap[val] || val;
          return val ?? "";
        })
      );
      const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-selected-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedLeads.length} selected leads.`);
    } catch (err) {
      toast.error("Failed to export selected leads.");
    }
  }

  const allSelected = leads.length > 0 && selectedIds.length === leads.length;

  const displayedColumns = ALL_COLUMNS.filter((c) =>
    visibleColumns.includes(c.key)
  );
  const websiteOptions = websites.map((w) => ({
    label: w.name,
    value: w.domain,
  }));
  const serviceOptions = services.map((s) => ({ label: s, value: s }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Leads
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {loading ? "Loading…" : `${total.toLocaleString()} total leads`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters() && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="mr-1 size-3" />
              Reset
            </Button>
          )}

          {/* Saved Views */}
          <div ref={savedViewsRef} className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavedViews(!showSavedViews)}
            >
              <Bookmark className="mr-1 size-3" />
              Views
            </Button>
            {showSavedViews && (
              <div className="absolute right-0 z-40 mt-1 w-64 rounded-lg border border-border bg-card p-2 shadow-lg">
                {savedViews.length > 0 ? (
                  <div className="mb-2 space-y-0.5">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Saved Views
                    </p>
                    {savedViews.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                      >
                        <button
                          onClick={() => loadView(v)}
                          className="flex-1 text-left text-foreground"
                        >
                          {v.name}
                        </button>
                        <button
                          onClick={() => deleteView(v.id)}
                          className="ml-2 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                    No saved views yet.
                  </p>
                )}
                <div className="border-t border-border pt-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      value={viewName}
                      onChange={(e) => setViewName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveCurrentView(); }}
                      placeholder="Save current filters…"
                      className="h-7 flex-1 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-ring"
                    />
                    <Button size="xs" onClick={saveCurrentView} disabled={!viewName.trim()}>
                      <Save className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Export (visible when items selected) */}
          {selectedIds.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportSelected}>
              <Download className="mr-1 size-3" />
              Export ({selectedIds.length})
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-1 size-3" />
            Export All
          </Button>
          <Button variant="outline" size="sm" onClick={loadLeads}>
            <RefreshCw className="mr-1 size-3" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="animate-slide-in overflow-visible">
        <CardContent className="flex flex-wrap items-end gap-3 p-4 overflow-visible">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Search name, email, phone…"
              className="pl-9 pr-8"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className={selectCls}
          >
            <option value="">All Statuses</option>
            {["New", "Contacted", "Closed", "Spam"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Combobox
            label="Websites"
            options={websiteOptions}
            value={website}
            onChange={(v) => { setWebsite(v); setPage(1); }}
            placeholder="All Websites"
          />
          <Combobox
            label="Services"
            options={serviceOptions}
            value={service}
            onChange={(v) => { setService(v); setPage(1); }}
            placeholder="All Services"
          />

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              title="Start date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              title="End date"
            />
          </div>

          <Button size="sm" onClick={handleSearch}>
            <Search className="mr-1 size-3" />
            Search
          </Button>

          {/* Column visibility toggle */}
          <div ref={columnMenuRef} className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setColumnMenuOpen(!columnMenuOpen)}
            >
              <Columns3 className="mr-1 size-3" />
              Columns
            </Button>
            {columnMenuOpen && (
              <div className="absolute right-0 z-40 mt-1 w-44 rounded-lg border border-border bg-card p-1.5 shadow-lg">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Show / Hide
                </p>
                {ALL_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.key)}
                      onChange={() => toggleColumn(col.key)}
                      className="size-3.5 rounded border-border accent-primary"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="animate-fade-in">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-10">
                  {leads.length > 0 && (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="size-3.5 rounded border-border accent-primary"
                    />
                  )}
                </TableHead>
                <TableHead className="w-10" />
                {displayedColumns.map((col) => (
                  <TableHead
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="cursor-pointer select-none transition-colors hover:text-foreground"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown className={`size-3 ${sort === col.key ? "text-primary" : "text-muted-foreground/40"}`} />
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="w-10" />
                    <TableCell className="w-10" />
                    {displayedColumns.map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : leads.length === 0 ? (
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell colSpan={displayedColumns.length + 2} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <Search className="size-8 text-muted-foreground/40" />
                      <p className="font-medium">No leads found</p>
                      <p>Try adjusting your search or filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow
                    key={lead._id}
                    className="cursor-pointer border-border transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/leads/${lead._id}`)}
                  >
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead._id)}
                        onChange={() => toggleSelect(lead._id)}
                        className="size-3.5 rounded border-border accent-primary"
                      />
                    </TableCell>
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => openDeleteDialog(lead, e)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive [tr:hover_&]:opacity-100"
                        title="Delete lead"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </TableCell>
                    {displayedColumns.map((col) => (
                      <TableCell key={col.key}>
                        {col.key === "name" ? (
                          <span className="font-medium text-foreground">{lead.name}</span>
                        ) : col.key === "website" ? (
                          <div>
                            <p className="text-sm font-medium">{websiteMap[lead.website] || lead.website}</p>
                            <p className="text-xs text-muted-foreground">{lead.website}</p>
                          </div>
                        ) : col.key === "status" ? (
                          <StatusBadge status={lead.status} />
                        ) : col.key === "assignee" ? (
                          <span className={lead.assignee ? "text-foreground" : "text-muted-foreground/40 italic"}>
                            {lead.assignee || "Unassigned"}
                          </span>
                        ) : col.key === "createdAt" ? (
                          <span className="text-muted-foreground" title={new Date(lead.createdAt).toLocaleString()}>
                            {formatRelativeTime(lead.createdAt)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {lead[col.key] || "—"}
                          </span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="animate-fade-in flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages} ({total.toLocaleString()} total)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-3" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      pageNum === page
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDeleteDialog}
          />
          <div className="animate-scale-in relative mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">
                  Delete Lead
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget.name}
                  </span>
                  ? This action cannot be undone.
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
                    onClick={closeDeleteDialog}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={confirmDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting…" : "Delete"}
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
