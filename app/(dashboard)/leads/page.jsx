"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

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
  const [error, setError] = useState("");

  const loadFilters = useCallback(async () => {
    try {
      const [w, s] = await Promise.all([api.getWebsites(), api.getServices()]);
      setWebsites(w);
      setServices(s.map((x) => x.name));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadLeads = useCallback(async () => {
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
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">{total} total</p>
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
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-xl border border-input bg-background px-3 text-sm outline-none"
        >
          <option value="">All Statuses</option>
          {["New", "Contacted", "Closed", "Spam"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={website}
          onChange={(e) => {
            setWebsite(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-xl border border-input bg-background px-3 text-sm outline-none"
        >
          <option value="">All Websites</option>
          {websites.map((w) => (
            <option key={w._id} value={w.domain}>{w.name}</option>
          ))}
        </select>
        <select
          value={service}
          onChange={(e) => {
            setService(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-xl border border-input bg-background px-3 text-sm outline-none"
        >
          <option value="">All Services</option>
          {services.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={resetFilters}
          className="h-9 rounded-xl border border-border px-3 text-sm text-muted-foreground hover:bg-muted"
        >
          Reset
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="cursor-pointer select-none px-4 py-3 font-medium hover:text-foreground"
                >
                  {col.label}
                  {sort === col.key ? (order === "asc" ? " ↑" : " ↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-muted-foreground">
                  No leads found.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead._id} className="hover:bg-muted">
                {COLUMNS.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.key === "name" ? (
                      <Link href={`/leads/${lead._id}`} className="font-medium text-primary hover:underline">
                        {lead.name}
                      </Link>
                    ) : col.key === "createdAt" ? (
                      new Date(lead.createdAt).toLocaleDateString()
                    ) : (
                      lead[col.key] || "—"
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-border px-3 py-1.5 disabled:opacity-50 hover:bg-muted"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-xl border border-border px-3 py-1.5 disabled:opacity-50 hover:bg-muted"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
