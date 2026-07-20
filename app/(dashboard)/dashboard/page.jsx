"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

function StatCard({ label, value, tone }) {
  const tones = {
    default: "text-foreground",
    new: "text-blue-600",
    contacted: "text-amber-600",
    closed: "text-emerald-600",
    spam: "text-red-600",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tones[tone] || tones.default}`}>{value}</p>
    </div>
  );
}

function BarChart({ title, data, labelKey }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 text-base font-medium">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data.</p>
      ) : (
        <div className="space-y-2">
          {data.map((d) => (
            <div key={d[labelKey]} className="flex items-center gap-3 text-sm">
              <span className="w-32 shrink-0 truncate text-muted-foreground" title={d[labelKey]}>
                {d[labelKey]}
              </span>
              <div className="h-5 flex-1 overflow-hidden rounded bg-muted">
                <div
                  className="h-full rounded bg-primary"
                  style={{ width: `${(d.count / max) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right font-medium">{d.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 text-base font-medium">Daily Leads (last 30 days)</h2>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data.</p>
      ) : (
        <div className="flex h-32 items-end gap-1">
          {data.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.count}`}
              className="flex-1 rounded-t bg-primary/70"
              style={{ height: `${(d.count / max) * 100}%` }}
            />
          ))}
        </div>
      )}
    </div>
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

  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Leads" value={stats?.total ?? "—"} />
        <StatCard label="Today" value={stats?.today ?? "—"} />
        <StatCard label="This Month" value={stats?.thisMonth ?? "—"} />
        <StatCard label="New" value={stats?.new ?? "—"} tone="new" />
        <StatCard label="Contacted" value={stats?.contacted ?? "—"} tone="contacted" />
        <StatCard label="Closed" value={stats?.closed ?? "—"} tone="closed" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DailyChart data={charts?.daily || []} />
        </div>
        <BarChart title="By Website" data={charts?.byWebsite || []} labelKey="website" />
        <BarChart title="By Service" data={charts?.byService || []} labelKey="service" />
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-medium">Recent Leads</h2>
          <Link href="/leads" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recent.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted-foreground">No leads yet.</p>
          )}
          {recent.map((lead) => (
            <Link
              key={lead._id}
              href={`/leads/${lead._id}`}
              className="flex items-center justify-between px-5 py-3 text-sm hover:bg-muted"
            >
              <div>
                <p className="font-medium">{lead.name}</p>
                <p className="text-muted-foreground">{lead.email}</p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                {lead.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
