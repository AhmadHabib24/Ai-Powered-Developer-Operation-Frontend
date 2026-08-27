"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/api";
import { formatDuration, timeAgo } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { acceptTimeExtension, listTasks, listTimeExtensions, rejectTimeExtension } from "@/services/tasks";
import type { Task } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function assignmentLabel(status?: string | null) {
  if (status === "pending") return "Waiting to receive";
  if (status === "accepted") return "Received";
  if (status === "declined") return "Declined";
  return null;
}

function useLiveElapsed(task: Task) {
  const base = task.live_timer?.elapsed_seconds ?? 0;
  const running = task.live_timer?.status === "running";
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setOffset(0);
    if (!running) return;
    const started = Date.now();
    const id = window.setInterval(() => setOffset(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [task.live_timer?.id, task.live_timer?.status, task.live_timer?.elapsed_seconds]);

  if (!task.live_timer) return 0;
  return base + offset;
}

function LiveTaskRow({ task }: { task: Task }) {
  const elapsed = useLiveElapsed(task);
  const liveBase = task.live_timer?.elapsed_seconds ?? 0;
  const billed = (task.billed_seconds ?? 0) - liveBase + elapsed;
  const over = Boolean(task.allocated_seconds) && billed > (task.allocated_seconds ?? 0);
  const received = assignmentLabel(task.assignment_status ?? task.assignment?.status);

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="flex flex-col gap-2 rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="font-medium text-white">{task.title}</p>
        <p className="mt-1 truncate text-xs text-slate-400">
          {task.project?.name ?? `Project #${task.project_id}`}
          {task.description ? ` · ${task.description}` : ""}
        </p>
        {task.latest_comment && (
          <p className="mt-1 truncate text-xs text-amber-200">
            {task.latest_comment.user?.name ?? "Someone"} commented {timeAgo(task.latest_comment.created_at)}: {task.latest_comment.body}
          </p>
        )}
        {task.latest_attachment && (
          <p className="mt-1 truncate text-xs text-slate-300">
            File: {task.latest_attachment.original_name} · {timeAgo(task.latest_attachment.created_at)}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {task.live_timer && (
          <Badge tone={over ? "red" : "green"}>
            {task.live_timer.user?.name ?? "Working"} · {formatDuration(elapsed)}
            {task.live_timer.status === "paused" ? " paused" : ""}
          </Badge>
        )}
        <Badge>{task.status.replace("_", " ")}</Badge>
        {received && (
          <Badge tone={task.assignment_status === "pending" ? "yellow" : "cyan"}>{received}</Badge>
        )}
        {task.transfer_locked && <Badge tone="yellow">Timer locked</Badge>}
        <span className="text-xs text-slate-400">{task.estimated_hours ?? 0}h allocated</span>
        <span className="text-xs text-slate-500">{task.assignee?.name ?? "Unassigned"}</span>
      </div>
    </Link>
  );
}

export default function TasksPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["tasks", search],
    queryFn: () => listTasks(search ? { search } : undefined),
    refetchInterval: 4000,
  });
  const pendingExtensions = useQuery({
    queryKey: ["time-extensions", "pending"],
    queryFn: () => listTimeExtensions({ status: "pending" }),
    enabled: can("tasks.assign"),
    refetchInterval: 8000,
  });

  const review = useMutation({
    mutationFn: ({ id, accept, note }: { id: number; accept: boolean; note?: string }) =>
      accept ? acceptTimeExtension(id, note) : rejectTimeExtension(id, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["time-extensions"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(variables.accept ? "Time extended. This is recorded on the performance ledger." : "Request declined. The timer stays red.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not review the request.")),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Work</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Tasks</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Live work, comments, and files show here. Time reports stay on the Time page.
        </p>
      </div>
      {can("tasks.assign") && (pendingExtensions.data?.data.length ?? 0) > 0 && (
        <Card>
          <CardTitle>Time extension requests</CardTitle>
          <div className="mt-4 space-y-3">
            {pendingExtensions.data?.data.map((item) => (
              <div key={item.id} className="rounded-xl bg-white/5 px-4 py-3">
                <p className="font-medium">{item.task?.title ?? `Task #${item.task_id}`}</p>
                <p className="mt-1 text-sm text-slate-300">
                  {item.user?.name} asked for {item.requested_minutes} more minutes. {item.reason}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" disabled={review.isPending} onClick={() => review.mutate({ id: item.id, accept: true })}>
                    Approve extra time
                  </Button>
                  <Button size="sm" variant="danger" disabled={review.isPending} onClick={() => review.mutate({ id: item.id, accept: false })}>
                    Decline
                  </Button>
                  <Link className="text-xs text-amber-300 self-center" href={`/tasks/${item.task_id ?? item.task?.id}`}>
                    Open task
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <input
        className="h-10 w-full max-w-md rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
        placeholder="Search tasks"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Card>
        <CardTitle>All visible tasks</CardTitle>
        <div className="mt-4 space-y-2">
          {isLoading && <p className="text-sm text-slate-400">Loading tasks…</p>}
          {data?.data.length === 0 && <p className="text-sm text-slate-400">No tasks yet.</p>}
          {data?.data.map((task) => (
            <LiveTaskRow key={task.id} task={task} />
          ))}
        </div>
      </Card>
    </div>
  );
}
