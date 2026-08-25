"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, formatDuration, formatHours } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { adjustTimeEntry, createManualEntry, getTimeSummary, listTimeEntries } from "@/services/time";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function TimePage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const { data: summary, isLoading: summaryLoading } = useQuery({ queryKey: ["time", "summary"], queryFn: () => getTimeSummary() });
  const { data: entries, isLoading: entriesLoading, error } = useQuery({ queryKey: ["time", "entries"], queryFn: () => listTimeEntries() });
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

  if (error) return <p className="text-rose-300">{apiErrorMessage(error, "Unable to load time entries.")}</p>;
  if (summaryLoading || entriesLoading || !summary) return <p className="text-slate-400">Loading time…</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Time tracking</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Entries and totals</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
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
      </div>
      {can("time.manage") && (
        <Card>
          <CardTitle>Manual entry</CardTitle>
          <p className="mt-2 text-sm text-slate-400">Creates a new immutable row. Use adjustments to correct an existing entry.</p>
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
          {entries?.data.length === 0 && <p className="text-sm text-slate-400">No time recorded yet.</p>}
          {entries?.data.map((entry) => (
            <div key={entry.id} className="rounded-xl bg-white/5 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{entry.task?.title ?? `Task #${entry.task_id}`}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(entry.started_at)} · {entry.work_mode} · {entry.source}
                    {entry.user?.name ? ` · ${entry.user.name}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono">{formatDuration(entry.billed_seconds)}</p>
                  {entry.adjustment_seconds !== 0 && (
                    <p className="text-xs text-cyan-300">
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
