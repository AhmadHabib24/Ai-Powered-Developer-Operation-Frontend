"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, formatDuration, formatHours } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { adjustTimeEntry, createManualEntry, getTimeSummary, listTimeEntries } from "@/services/time";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function TimePage() {
  const { can, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["time", "summary"],
    queryFn: () => getTimeSummary(),
    enabled: can("time.view"),
  });
  const { data: entries, isLoading: entriesLoading, error } = useQuery({
    queryKey: ["time", "entries"],
    queryFn: () => listTimeEntries(),
    enabled: can("time.view"),
  });
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [deltaMinutes, setDeltaMinutes] = useState("15");
  const [reason, setReason] = useState("");
  const [manual, setManual] = useState({ task_id: "", started_at: "", ended_at: "", reason: "" });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["time"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const adjust = useMutation({
    mutationFn: () =>
      adjustTimeEntry(adjusting!, {
        delta_seconds: Math.round(Number(deltaMinutes) * 60),
        reason,
      }),
    onSuccess: () => {
      setAdjusting(null);
      setReason("");
      refresh();
      toast.success("Adjustment recorded. The original entry was not changed.");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not adjust time.")),
  });

  const manualEntry = useMutation({
    mutationFn: () =>
      createManualEntry({
        task_id: Number(manual.task_id),
        started_at: manual.started_at,
        ended_at: manual.ended_at,
        reason: manual.reason,
      }),
    onSuccess: () => {
      setManual({ task_id: "", started_at: "", ended_at: "", reason: "" });
      refresh();
      toast.success("Manual entry created");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not create the entry.")),
  });

  if (authLoading) return <p className="text-muted">Loading time…</p>;
  if (!can("time.view")) return <p className="text-rose-700 dark:text-rose-300">You do not have permission to view this.</p>;
  if (error) return <p className="text-rose-700 dark:text-rose-300">{apiErrorMessage(error, "Unable to load time entries.")}</p>;
  if (summaryLoading || entriesLoading || !summary) return <p className="text-muted">Loading time…</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Time report</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Hours by task</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          This is not the task list. It shows who spent time where: averages, task totals, and the raw entries underneath.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardTitle>Today</CardTitle>
          <p className="mt-2 text-3xl">{formatHours(summary.today_seconds)}</p>
        </Card>
        <Card>
          <CardTitle>This week</CardTitle>
          <p className="mt-2 text-3xl">{formatHours(summary.week_seconds)}</p>
        </Card>
        <Card>
          <CardTitle>This month</CardTitle>
          <p className="mt-2 text-3xl">{formatHours(summary.month_seconds)}</p>
        </Card>
        <Card>
          <CardTitle>Average / task</CardTitle>
          <p className="mt-2 text-3xl">{formatHours(summary.average_seconds ?? 0)}</p>
          <p className="mt-1 text-xs text-muted">{summary.task_count ?? 0} task(s) this period</p>
        </Card>
      </div>
      <Card>
        <CardTitle>Time by task</CardTitle>
        <div className="mt-4 space-y-2">
          {(summary.by_task ?? []).length === 0 && <p className="text-sm text-muted">No time recorded in this period.</p>}
          {(summary.by_task ?? []).map((row) => (
            <Link
              key={row.task_id}
              href={`/tasks/${row.task_id}`}
              className="flex flex-col gap-1 rounded-xl bg-foreground/5 px-4 py-3 hover:bg-foreground/10 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{row.task ?? `Task #${row.task_id}`}</p>
                <p className="text-xs text-muted">
                  {row.project ?? `Project #${row.project_id}`} · {row.sessions} session(s)
                  {row.estimated_hours ? ` · ${row.estimated_hours}h allocated` : ""}
                </p>
              </div>
              <p className="font-mono text-sm">{formatHours(row.seconds)}</p>
            </Link>
          ))}
        </div>
      </Card>
      {can("time.manage") && (
        <Card>
          <CardTitle>Manual entry</CardTitle>
          <p className="mt-2 text-sm text-muted">Creates a new immutable row. Use adjustments to correct an existing entry.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input placeholder="Task ID" value={manual.task_id} onChange={(e) => setManual({ ...manual, task_id: e.target.value })} />
            <Input placeholder="Reason" value={manual.reason} onChange={(e) => setManual({ ...manual, reason: e.target.value })} />
            <Input type="datetime-local" value={manual.started_at} onChange={(e) => setManual({ ...manual, started_at: e.target.value })} />
            <Input type="datetime-local" value={manual.ended_at} onChange={(e) => setManual({ ...manual, ended_at: e.target.value })} />
          </div>
          <Button className="mt-3" disabled={manualEntry.isPending} onClick={() => manualEntry.mutate()}>
            Add entry
          </Button>
        </Card>
      )}
      <Card>
        <CardTitle>Recent entries</CardTitle>
        <div className="mt-4 space-y-3">
          {entries?.data.length === 0 && <p className="text-sm text-muted">No time recorded yet.</p>}
          {entries?.data.map((entry) => (
            <div key={entry.id} className="rounded-xl bg-foreground/5 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{entry.task?.title ?? `Task #${entry.task_id}`}</p>
                  <p className="text-xs text-muted">
                    {formatDate(entry.started_at)} · {entry.work_mode} · {entry.source}
                    {entry.user?.name ? ` · ${entry.user.name}` : ""}
                    {entry.task?.project_id ? ` · project #${entry.task.project_id}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono">{formatDuration(entry.billed_seconds)}</p>
                  {entry.adjustment_seconds !== 0 && (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {entry.adjustment_seconds > 0 ? "+" : ""}
                      {formatDuration(Math.abs(entry.adjustment_seconds))} adjusted
                    </p>
                  )}
                </div>
              </div>
              {can("time.manage") && (
                <div className="mt-3">
                  {adjusting === entry.id ? (
                    <div className="flex flex-wrap items-end gap-2">
                      <Input className="w-28" type="number" value={deltaMinutes} onChange={(e) => setDeltaMinutes(e.target.value)} />
                      <Input className="min-w-56 flex-1" placeholder="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
                      <Button size="sm" disabled={adjust.isPending || reason.length < 3} onClick={() => adjust.mutate()}>
                        Save adjustment
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAdjusting(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setAdjusting(entry.id)}>
                      Adjust
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
