"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  FolderKanban,
  GitCommitHorizontal,
  Hourglass,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { StatTile } from "@/components/dashboard/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCtoDashboard } from "@/services/dashboards";
import { useAuth } from "@/providers/auth-provider";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function CtoDashboardPage() {
  const { user, can } = useAuth();
  const { resolvedTheme } = useTheme();
  const dash = useQuery({ queryKey: ["dashboard", "cto"], queryFn: getCtoDashboard });
  const d = dash.data;
  const axis = resolvedTheme === "light" ? "#57534e" : "#94a3b8";
  const grid = resolvedTheme === "light" ? "#e7e5e4" : "rgba(255,255,255,0.08)";
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const chartData = Object.entries(d?.task_status ?? {}).map(([status, count]) => ({
    status: status.replaceAll("_", " "),
    count,
  }));

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-50 via-card to-orange-50 p-6 dark:from-[#16110a] dark:via-card dark:to-[#0b1220]">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-24 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">Command center</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {greeting}, {user?.name?.split(" ")[0] ?? "Habib"}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Delivery health, people load, and the work that needs a decision today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {can("projects.view") && (
              <Link href="/projects">
                <Button variant="secondary">Projects</Button>
              </Link>
            )}
            {can("performance.view") && (
              <Link href="/performance">
                <Button>Open performance</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {dash.isLoading && <p className="text-sm text-muted">Loading command center…</p>}
      {dash.isError && <p className="text-sm text-rose-700 dark:text-rose-300">Could not load dashboard.</p>}

      {d && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Projects" value={d.totals.projects} hint="In the portfolio" icon={FolderKanban} tone="gold" />
            <StatTile label="Active tasks" value={d.totals.active_tasks} hint={`${d.totals.completed_tasks} already done`} icon={ClipboardList} tone="gold" />
            <StatTile label="Overdue" value={d.totals.overdue_tasks} hint="Need a call" icon={AlertTriangle} tone="red" />
            <StatTile
              label="Hours this week"
              value={`${d.totals.time_tracked_hours}h`}
              hint="Logged across the team"
              icon={Hourglass}
              tone="green"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_12px_40px_rgba(28,25,23,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Task mix</h2>
                  <p className="text-xs text-muted">Where work currently sits</p>
                </div>
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              </div>
              <div className="h-64">
                {chartData.length === 0 ? (
                  <p className="grid h-full place-items-center text-sm text-muted">No tasks yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                      <XAxis dataKey="status" stroke={axis} tick={{ fill: axis, fontSize: 12 }} />
                      <YAxis stroke={axis} allowDecimals={false} tick={{ fill: axis, fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: resolvedTheme === "light" ? "#fffaf3" : "#111827",
                          border: "1px solid rgba(245,158,11,0.25)",
                          color: resolvedTheme === "light" ? "#1c1917" : "#f8fafc",
                          borderRadius: 12,
                        }}
                      />
                      <Bar dataKey="count" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_12px_40px_rgba(28,25,23,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
              <h2 className="text-lg font-semibold text-foreground">Signals</h2>
              <div className="mt-4 space-y-3">
                <Insight label="Developers" value={String(d.totals.active_developers)} icon={Users} />
                <Insight label="Git commits" value={String(d.totals.git_commits_week)} hint="this week" icon={GitCommitHorizontal} />
                <Insight
                  label="Open AI reviews"
                  value={String(d.totals.ai_reviews_open)}
                  icon={AlertTriangle}
                  warn={d.totals.ai_reviews_open > 0}
                />
                <Insight label="Points this week" value={String(d.totals.performance_points_week ?? 0)} icon={Trophy} />
              </div>
            </section>
          </div>

          {(d.alerts.length > 0 || d.insights.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-3">
              {d.alerts.length > 0 && (
                <section className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-5 lg:col-span-2">
                  <h2 className="text-lg font-semibold text-foreground">Needs attention</h2>
                  <div className="mt-3 space-y-2">
                    {d.alerts.map((alert, index) => (
                      <div
                        key={`${alert.message}-${index}`}
                        className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-2"
                      >
                        <span
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${alert.level === "red" ? "bg-rose-500" : "bg-amber-400"}`}
                        />
                        <p className="text-sm text-foreground">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {d.insights.length > 0 && (
                <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
                  <h2 className="text-lg font-semibold text-foreground">Insights</h2>
                  <ul className="mt-3 space-y-2">
                    {d.insights.map((insight) => (
                      <li key={insight} className="text-sm text-muted">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Project health</h2>
              {can("projects.view") && (
                <Link href="/projects" className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                  All projects <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {d.projects.length === 0 && (
                <p className="text-sm text-muted">No projects yet.</p>
              )}
              {d.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition hover:border-amber-400/40"
                >
                  <div
                    className={`absolute inset-y-0 left-0 w-1 ${
                      project.health === "red"
                        ? "bg-rose-500"
                        : project.health === "yellow"
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                    }`}
                  />
                  <div className="flex items-start justify-between gap-3 pl-2">
                    <div>
                      <p className="font-medium text-foreground">{project.name}</p>
                      <p className="mt-1 text-xs text-muted">{project.health_reason}</p>
                      {project.deadline && (
                        <p className="mt-2 text-xs text-muted">Due {formatDate(project.deadline)}</p>
                      )}
                    </div>
                    <Badge tone={project.health}>{project.health}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Insight({
  label,
  value,
  hint,
  icon: Icon,
  warn,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Users;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
      <span className="inline-flex items-center gap-2 text-sm text-muted">
        <Icon className={`h-4 w-4 ${warn ? "text-rose-500" : "text-amber-600 dark:text-amber-300"}`} />
        {label}
      </span>
      <span className={`font-medium ${warn ? "text-rose-700 dark:text-rose-300" : "text-foreground"}`}>
        {value}
        {hint ? <span className="ml-1 text-xs font-normal text-muted">{hint}</span> : null}
      </span>
    </div>
  );
}
