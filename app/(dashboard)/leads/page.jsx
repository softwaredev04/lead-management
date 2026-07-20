"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "service", label: "Service" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created" },
];

const selectCls =
  "h-9 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring";

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [website, setWebsite] = useState("");
  const [service, setService] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [websites, setWebsites] = useState([]);
  const [services, setServices] = useState([]);
  const [websiteMap, setWebsiteMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFilters = useCallback(async () => {
    try {
      const [w, s] = await Promise.all([api.getWebsites(), api.getServices()]);
      setWebsites(w);
      setServices(s.map((x) => x.name));
      const map = {};
      for (const site of w) map[site.domain] = site.name;
      setWebsiteMap(map);
    } catch (err) {
      setError(err.message);
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
      const res = await api.getLeads(params);
      setLeads(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, website, service, sort, order]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  function toggleSort(key) {
    if (sort === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(key);
      setOrder("asc");
    }
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setStatus("");
    setWebsite("");
    setService("");
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading…" : `${total} total leads`}
          </p>
        </div>
        <button
          onClick={resetFilters}
          className="h-9 rounded-xl border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          Reset filters
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, email, phone…"
          className="h-9 w-64 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All Statuses</option>
          {["New", "Contacted", "Closed", "Spam"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={website} onChange={(e) => { setWebsite(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All Websites</option>
          {websites.map((w) => (
            <option key={w._id} value={w.domain}>{w.name}</option>
          ))}
        </select>
        <select value={service} onChange={(e) => { setService(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All Services</option>
          {services.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="cursor-pointer select-none px-4 py-3 font-medium transition-colors hover:text-foreground"
                >
                  {col.label}
                  {sort === col.key ? (order === "asc" ? " ↑" : " ↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-muted-foreground">
                  No leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead._id} className="transition-colors hover:bg-muted">
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.key === "name" ? (
                        <Link href={`/leads/${lead._id}`} className="font-medium text-primary hover:underline">
                          {lead.name}
                        </Link>
                      ) : col.key === "website" ? (
                        <div>
                          <p className="font-medium">{websiteMap[lead.website] || lead.website}</p>
                          <p className="text-xs text-muted-foreground">{lead.website}</p>
                        </div>
                      ) : col.key === "status" ? (
                        <StatusBadge status={lead.status} />
                      ) : col.key === "createdAt" ? (
                        new Date(lead.createdAt).toLocaleDateString()
                      ) : (
                        lead[col.key] || "—"
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && leads.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-border px-3 py-1.5 transition-colors hover:bg-muted disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl border border-border px-3 py-1.5 transition-colors hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
