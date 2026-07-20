"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

function StatCard({ label, value, tone }) {
  const tones = {
    default: "text-foreground",
    new: "text-blue-600",
    contacted: "text-amber-600",
    closed: "text-emerald-600",
    spam: "text-red-600",
  };
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-2 text-3xl font-semibold ${tones[tone] || tones.default}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function BarChart({ title, data, labelKey }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <div className="space-y-2.5">
            {data.map((d) => (
              <div key={d[labelKey]} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate text-muted-foreground" title={d[labelKey]}>
                  {d[labelKey]}
                </span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-muted">
                  <div
                    className="h-full rounded bg-primary transition-all"
                    style={{ width: `${(d.count / max) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium">{d.count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DailyChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
  const map = Object.fromEntries(data.map((x) => [x.date, x.count]));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Leads</CardTitle>
        <p className="text-xs text-muted-foreground">Last 30 days</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <div className="flex h-36 items-end gap-1">
            {days.map((day) => (
              <div
                key={day}
                title={`${day}: ${map[day] || 0}`}
                className="flex-1 rounded-t bg-primary/70 transition-all hover:bg-primary"
                style={{ height: `${((map[day] || 0) / max) * 100}%` }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [charts, setCharts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [s, leads, c] = await Promise.all([
          api.getStats(),
          api.getLeads({ limit: 5, sort: "createdAt", order: "desc" }),
          api.getCharts(),
        ]);
        setStats(s);
        setRecent(leads.data || []);
        setCharts(c);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, []);

  if (error)
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );

  const loading = !stats && !charts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of all leads across ClickMasters websites.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-4xl" />
          ))
        ) : (
          <>
            <StatCard label="Total Leads" value={stats?.total ?? 0} />
            <StatCard label="Today" value={stats?.today ?? 0} />
            <StatCard label="This Month" value={stats?.thisMonth ?? 0} />
            <StatCard label="New" value={stats?.new ?? 0} tone="new" />
            <StatCard label="Contacted" value={stats?.contacted ?? 0} tone="contacted" />
            <StatCard label="Closed" value={stats?.closed ?? 0} tone="closed" />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {charts ? <DailyChart data={charts.daily || []} /> : <Skeleton className="h-72 rounded-4xl" />}
        </div>
        {charts ? (
          <>
            <BarChart title="By Website" data={charts.byWebsite || []} labelKey="website" />
            <BarChart title="By Service" data={charts.byService || []} labelKey="service" />
          </>
        ) : (
          <>
            <Skeleton className="h-72 rounded-4xl" />
            <Skeleton className="h-72 rounded-4xl" />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent Leads</CardTitle>
          <Link href="/leads" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No leads yet.</p>
          ) : (
            <Table>
              <TableBody>
                {recent.map((lead) => (
                  <TableRow key={lead._id} className="border-border">
                    <TableCell>
                      <Link href={`/leads/${lead._id}`} className="block">
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-muted-foreground">{lead.email}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={lead.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
