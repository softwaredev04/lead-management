"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { OVERDUE_DAYS } from "@/lib/config";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Calendar,
  TrendingUp,
  MessageSquare,
  PhoneCall,
  CheckCircle,
  XCircle,
  Target,
  Inbox,
  Clock,
  Zap,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function StatCard({ label, value, icon: Icon, trend, color }) {
  const colors = {
    default: "from-primary/10 to-primary/5 border-primary/20",
    new: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    contacted: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    closed: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    spam: "from-red-500/10 to-red-500/5 border-red-500/20",
  };
  return (
    <Card className="animate-fade-in overflow-hidden border-0 bg-gradient-to-br shadow-md ring-1 ring-foreground/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {value ?? "—"}
            </p>
          </div>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color] || colors.default} border`}
          >
            <Icon className="size-5 text-foreground/70" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="size-3 text-emerald-500" />
            <span>{trend} from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-lg">
        <p className="font-medium text-foreground">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-muted-foreground">
            {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [charts, setCharts] = useState(null);
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
        toast.error(err.message);
      }
    }
    load();
  }, []);

  const loading = !stats && !charts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of all leads across ClickMasters websites.
        </p>
      </div>

      {/* Stat Cards - Row 1: Core metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[116px] rounded-xl" />
            ))
          : [
              { label: "Total Leads", value: stats?.total ?? 0, icon: Users },
              { label: "Today", value: stats?.today ?? 0, icon: Calendar },
              { label: "This Month", value: stats?.thisMonth ?? 0, icon: TrendingUp },
              { label: "Conversion Rate", value: `${stats?.conversionRate ?? 0}%`, icon: Target, color: "default" },
              { label: "Avg Score", value: stats?.avgLeadScore ?? 0, icon: Zap, color: "default" },
              { label: "Follow-up Due", value: stats?.followUpDue ?? 0, icon: Clock, color: (stats?.followUpDue ?? 0) > 0 ? "contacted" : "default", trend: "Assigned, no activity 3+ days" },
            ].map((card, i) => (
              <div key={card.label} style={{ animationDelay: `${(i + 1) * 0.05}s` }}>
                <StatCard {...card} />
              </div>
            ))}
      </div>

      {/* Stat Cards - Row 2: Status breakdown */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {!loading && [
          { label: "New", value: stats?.new ?? 0, icon: MessageSquare, color: "new" },
          { label: "Contacted", value: stats?.contacted ?? 0, icon: PhoneCall, color: "contacted" },
          { label: "Closed Won", value: stats?.closedWon ?? 0, icon: CheckCircle, color: "closed" },
          { label: "Closed Lost", value: stats?.closedLost ?? 0, icon: XCircle, color: "spam" },
        ].map((card, i) => (
          <div key={card.label} style={{ animationDelay: `${(i + 1) * 0.05}s` }}>
            <StatCard {...card} />
          </div>
        ))}
      </div>

      {/* Focus & Workload */}
      {!loading && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>My Focus</CardTitle>
              <p className="text-xs text-muted-foreground">Where to work next</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/leads?assigneeId=me"
                className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Target className="size-4 text-primary" />
                  <span className="text-foreground">My open leads</span>
                </div>
                <span className="text-lg font-bold text-foreground">{stats?.myLeads ?? 0}</span>
              </Link>
              <Link
                href="/leads?assigneeId=none"
                className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Inbox className="size-4 text-amber-500" />
                  <span className="text-foreground">Unassigned</span>
                </div>
                <span className="text-lg font-bold text-foreground">{stats?.unassigned ?? 0}</span>
              </Link>
              <Link
                href="/leads?assigneeId=none&status=New"
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                  (stats?.overdue ?? 0) > 0
                    ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Clock
                    className={`size-4 ${(stats?.overdue ?? 0) > 0 ? "text-red-500" : "text-muted-foreground"}`}
                  />
                  <span className="text-foreground">
                    Overdue
                    <span className="block text-xs text-muted-foreground">
                      Unassigned New leads &gt; {OVERDUE_DAYS} days
                    </span>
                  </span>
                </div>
                <span
                  className={`text-lg font-bold ${(stats?.overdue ?? 0) > 0 ? "text-red-500" : "text-foreground"}`}
                >
                  {stats?.overdue ?? 0}
                </span>
              </Link>
            </CardContent>
          </Card>

          <Card className="animate-fade-in lg:col-span-2">
            <CardHeader>
              <CardTitle>Team Workload</CardTitle>
              <p className="text-xs text-muted-foreground">
                Open leads per assignee (top 6) — click a name to see their queue
              </p>
            </CardHeader>
            <CardContent>
              {!stats?.workload?.length ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  No assigned leads yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const max = Math.max(...stats.workload.map((w) => w.count), 1);
                    return stats.workload.map((w) => (
                      <div key={w.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{w.name}</span>
                          <span className="text-muted-foreground">{w.count} open</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/70"
                            style={{ width: `${(w.count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Daily Leads - Area Chart */}
        <div className="lg:col-span-2">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Daily Leads</CardTitle>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-56 w-full rounded-lg" />
              ) : !charts?.daily?.length ? (
                <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                  No data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={charts.daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#colorCount)"
                      name="Leads"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* By Website */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>By Website</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full rounded-lg" />
            ) : !charts?.byWebsite?.length ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                No data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.byWebsite} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="website"
                    type="category"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="var(--primary)"
                    radius={[0, 4, 4, 0]}
                    name="Leads"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* By Service */}
        <Card className="animate-fade-in lg:col-span-2">
          <CardHeader>
            <CardTitle>By Service</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full rounded-lg" />
            ) : !charts?.byService?.length ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                No data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={charts.byService} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="service"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="var(--chart-3)"
                    radius={[4, 4, 0, 0]}
                    name="Leads"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads Table */}
      <Card className="animate-fade-in">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Leads</CardTitle>
            <p className="text-xs text-muted-foreground">Latest 5 submissions</p>
          </div>
          <Link
            href="/leads"
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-sm text-muted-foreground">
              <Users className="size-8 text-muted-foreground/40" />
              <p>No leads yet. Leads from your websites will appear here.</p>
            </div>
          ) : (
            <Table>
              <TableBody>
                {recent.map((lead) => (
                  <TableRow key={lead._id} className="border-border transition-colors hover:bg-muted/30">
                    <TableCell>
                      <Link href={`/leads/${lead._id}`} className="block">
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
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
