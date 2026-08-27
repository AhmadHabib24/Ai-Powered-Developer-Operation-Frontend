"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { awardPointsSchema, performanceRuleSchema } from "@/schemas/auth";
import {
  awardPerformancePoints,
  createPerformanceRule,
  generateWeeklyReports,
  getMonthlySummary,
  getPerformanceAnalytics,
  listPerformancePoints,
  listPerformanceRules,
  listWeeklyReports,
  recalculatePerformance,
  updatePerformanceRule,
} from "@/services/performance";
import { listUsers } from "@/services/users";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

export default function PerformancePage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const rules = useQuery({ queryKey: ["performance", "rules"], queryFn: listPerformanceRules, enabled: can("performance.view") });
  const points = useQuery({ queryKey: ["performance", "points"], queryFn: () => listPerformancePoints(), enabled: can("performance.view") });
  const analytics = useQuery({
    queryKey: ["performance", "analytics"],
    queryFn: getPerformanceAnalytics,
    enabled: can("performance.view") && can("reports.view"),
  });
  const weekly = useQuery({ queryKey: ["reports", "weekly"], queryFn: listWeeklyReports, enabled: can("reports.view") });
  const monthly = useQuery({
    queryKey: ["reports", "monthly"],
    queryFn: getMonthlySummary,
    enabled: can("reports.view") && can("projects.delete"),
  });
  const users = useQuery({ queryKey: ["users"], queryFn: () => listUsers(), enabled: can("users.view") });
  const ruleForm = useForm<z.infer<typeof performanceRuleSchema>>({ resolver: zodResolver(performanceRuleSchema), defaultValues: { points: 2 } });
  const awardForm = useForm<z.infer<typeof awardPointsSchema>>({ resolver: zodResolver(awardPointsSchema) });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["performance"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createRule = useMutation({
    mutationFn: (values: z.infer<typeof performanceRuleSchema>) =>
      createPerformanceRule({ ...values, conditions: { event: "manual" } }),
    onSuccess: () => {
      ruleForm.reset({ points: 2 });
      refresh();
      toast.success("Rule saved");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not save the rule.")),
  });
  const award = useMutation({
    mutationFn: (values: z.infer<typeof awardPointsSchema>) => awardPerformancePoints(values),
    onSuccess: () => {
      awardForm.reset();
      refresh();
      toast.success("Ledger row appended");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not award points.")),
  });
  const toggleRule = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => updatePerformanceRule(id, { is_active }),
    onSuccess: refresh,
  });
  const recalc = useMutation({
    mutationFn: recalculatePerformance,
    onSuccess: () => {
      refresh();
      toast.success("Scores recalculated");
    },
  });
  const weeklyGen = useMutation({
    mutationFn: generateWeeklyReports,
    onSuccess: () => {
      refresh();
      toast.success("Weekly reports stored");
    },
  });

  if (!can("performance.view")) {
    return <p className="text-rose-300">You do not have permission to view performance.</p>;
  }

  const scoreChart = (analytics.data?.developers ?? []).map((row) => ({ name: row.user.name, score: row.score ?? 0 }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Evidence ledger</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Performance</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Points are append-only. Scores are a 0–100 rollup of delivery, punctuality, review hygiene, and ledger points. Commit count is never the only input.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can("performance.manage") && (
            <Button variant="secondary" onClick={() => recalc.mutate()} disabled={recalc.isPending}>
              Recalculate scores
            </Button>
          )}
          {can("reports.manage") && (
            <Button onClick={() => weeklyGen.mutate()} disabled={weeklyGen.isPending}>
              Generate weekly reports
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>Points this week</CardTitle>
          <p className="mt-3 text-3xl">{analytics.data?.org_points_week ?? 0}</p>
        </Card>
        <Card>
          <CardTitle>Developers with a score</CardTitle>
          <p className="mt-3 text-3xl">{analytics.data?.scored_developers ?? 0}</p>
        </Card>
        <Card>
          <CardTitle>Ledger rows</CardTitle>
          <p className="mt-3 text-3xl">{points.data?.length ?? 0}</p>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>Weekly scores</CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreChart}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardTitle>Points by week</CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.data?.points_by_week ?? []}>
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="points" fill="#a78bfa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      {can("performance.manage") && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardTitle>New scoring rule</CardTitle>
            <form className="mt-4 grid gap-3" onSubmit={ruleForm.handleSubmit((values) => createRule.mutate(values))}>
              <Input placeholder="Name" {...ruleForm.register("name")} />
              <Input placeholder="slug_like_this" {...ruleForm.register("slug")} />
              <Input type="number" placeholder="Points" {...ruleForm.register("points")} />
              <Button type="submit" disabled={createRule.isPending}>
                Save rule
              </Button>
            </form>
          </Card>
          <Card>
            <CardTitle>Manual award</CardTitle>
            <form className="mt-4 grid gap-3" onSubmit={awardForm.handleSubmit((values) => award.mutate(values))}>
              <select className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm" {...awardForm.register("user_id")}>
                <option value="">Person</option>
                {(users.data?.data ?? []).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <select className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm" {...awardForm.register("rule_id")}>
                <option value="">Rule</option>
                {(rules.data ?? []).filter((rule) => rule.is_active).map((rule) => (
                  <option key={rule.id} value={rule.id}>
                    {rule.name} ({rule.points})
                  </option>
                ))}
              </select>
              <Input placeholder="Reason (required)" {...awardForm.register("reason")} />
              <Button type="submit" disabled={award.isPending}>
                Append to ledger
              </Button>
            </form>
          </Card>
        </div>
      )}
      <Card>
        <CardTitle>Rules</CardTitle>
        <div className="mt-4 space-y-2">
          {(rules.data ?? []).map((rule) => (
            <div key={rule.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <div>
                <p className="font-medium">{rule.name}</p>
                <p className="text-xs text-slate-400">
                  {rule.slug} · {rule.conditions?.event ?? "manual"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={rule.is_active ? "green" : "slate"}>{rule.points} pts</Badge>
                {can("performance.manage") && (
                  <Button size="sm" variant="secondary" onClick={() => toggleRule.mutate({ id: rule.id, is_active: !rule.is_active })}>
                    {rule.is_active ? "Deactivate" : "Activate"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle>Ledger</CardTitle>
        <div className="mt-4 space-y-2">
          {(points.data ?? []).length === 0 && <p className="text-sm text-slate-400">No points recorded yet.</p>}
          {(points.data ?? []).map((row) => (
            <div key={row.id} className="rounded-xl bg-white/5 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {row.user?.name ?? "User"} · {row.points > 0 ? "+" : ""}
                  {row.points}
                </p>
                <Badge>{row.rule?.name ?? "manual"}</Badge>
              </div>
              <p className="mt-1 text-slate-400">{row.reason}</p>
            </div>
          ))}
        </div>
      </Card>
      {monthly.data && (
        <Card>
          <CardTitle>Monthly CTO summary</CardTitle>
          <p className="mt-2 text-sm text-slate-400">{monthly.data.note}</p>
          <p className="mt-2 text-sm text-slate-300">
            {monthly.data.completed_tasks} completions · {monthly.data.points} points · {monthly.data.period.from} to {monthly.data.period.to}
          </p>
          <div className="mt-3 space-y-2">
            {monthly.data.developers.map((row) => (
              <div key={row.user.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2 text-sm">
                <span>{row.user.name}</span>
                <span className="text-slate-400">
                  {row.completed} done · {row.points} pts · score {row.score ?? "—"} · {row.hours}h
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
      {(weekly.data ?? []).length > 0 && (
        <Card>
          <CardTitle>Weekly reports</CardTitle>
          <div className="mt-3 space-y-2 text-sm">
            {weekly.data?.slice(0, 8).map((report) => (
              <div key={report.id} className="rounded-xl bg-white/5 px-4 py-3">
                <p className="font-medium">
                  {report.user?.name ?? `User ${report.user_id}`} · week of {report.week_start}
                </p>
                <p className="text-slate-400">{report.ai_summary}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
