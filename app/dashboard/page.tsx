"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useNovaCommand } from "@/components/nova-command/nova-command-context";
import { apiErrorMessage } from "@/lib/api";
import { getCtoDashboard } from "@/services/dashboards";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function CtoDashboardPage() {
  const router = useRouter();
  const { setOpen, canEngage } = useNovaCommand();
  const { data, isLoading, error } = useQuery({ queryKey: ["dashboard", "cto"], queryFn: getCtoDashboard });

  if (isLoading) return <p className="text-slate-400">Loading command center…</p>;
  if (error || !data) return <p className="text-rose-300">{apiErrorMessage(error, "Unable to load the command center.")}</p>;

  const chart = Object.entries(data.task_status ?? {}).map(([name, total]) => ({ name, total }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">CTO command center</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Today across the org</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEngage && (
            <Button variant="secondary" onClick={() => setOpen(true)}>
              Engage NOVA
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.push("/performance")}>
            Performance
          </Button>
          <Button onClick={() => router.push("/nova")}>Talk to NOVA</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Projects", data.totals.projects],
          ["Active developers", data.totals.active_developers],
          ["Active tasks", data.totals.active_tasks],
          ["Overdue", data.totals.overdue_tasks],
          ["Hours this week", data.totals.time_tracked_hours],
          ["Commits this week", data.totals.git_commits_week],
          ["Open review findings", data.totals.ai_reviews_open],
          ["Points this week", data.totals.performance_points_week ?? 0],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardTitle>{label}</CardTitle>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      {data.alerts.length > 0 && (
        <Card className="border-rose-400/20">
          <CardTitle>Critical alerts</CardTitle>
          <ul className="mt-3 space-y-2 text-sm text-rose-200">
            {data.alerts.map((alert) => (
              <li key={alert.message}>{alert.message}</li>
            ))}
          </ul>
        </Card>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>Task mix</CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle>AI insights</CardTitle>
          <ul className="mt-3 space-y-3 text-sm text-slate-300">
            {data.insights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Project health</CardTitle>
          <Link className="text-sm text-cyan-300" href="/projects">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {data.projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="flex flex-col gap-2 rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{project.name}</p>
                <p className="text-xs text-slate-400">{project.health_reason}</p>
              </div>
              <Badge tone={project.health}>{project.health}</Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
