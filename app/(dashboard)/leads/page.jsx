"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  "h-9 rounded-3xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring";

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
          className="h-9 rounded-3xl border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          Reset filters
        </button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, phone…"
            className="w-64"
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
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                {COLUMNS.map((col) => (
                  <TableHead
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="cursor-pointer select-none transition-colors hover:text-foreground"
                  >
                    {col.label}
                    {sort === col.key ? (order === "asc" ? " ↑" : " ↓") : ""}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    {COLUMNS.map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : leads.length === 0 ? (
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell colSpan={COLUMNS.length} className="py-10 text-center text-muted-foreground">
                    No leads found.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead._id} className="border-border">
                    {COLUMNS.map((col) => (
                      <TableCell key={col.key}>
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
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!loading && leads.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-3xl border border-border px-3 py-1.5 transition-colors hover:bg-muted disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-3xl border border-border px-3 py-1.5 transition-colors hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
