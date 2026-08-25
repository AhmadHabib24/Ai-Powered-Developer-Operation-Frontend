"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api";
import { formatDuration } from "@/lib/utils";
import { pauseTimer, resumeTimer, startTimer, stopTimer } from "@/services/time";
import type { TimeSession } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function useLiveSeconds(session: TimeSession | null) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setOffset(0);
    if (session?.status !== "running") return;
    const started = Date.now();
    const id = window.setInterval(() => setOffset(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [session?.id, session?.status, session?.elapsed_seconds]);

  if (!session) return 0;
  return session.elapsed_seconds + offset;
}

export function TimerPanel({
  session,
  taskId,
  taskTitle,
}: {
  session: TimeSession | null;
  taskId?: number;
  taskTitle?: string;
}) {
  const queryClient = useQueryClient();
  const elapsed = useLiveSeconds(session);
  const onThisTask = Boolean(taskId && session && session.task_id === taskId);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["time"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    if (taskId) queryClient.invalidateQueries({ queryKey: ["task", String(taskId)] });
  };

  const start = useMutation({
    mutationFn: () => startTimer(taskId!),
    onSuccess: () => {
      invalidate();
      toast.success("Timer started");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not start the timer.")),
  });
  const pause = useMutation({
    mutationFn: () => pauseTimer(session!.id),
    onSuccess: () => {
      invalidate();
      toast.success("Timer paused");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not pause the timer.")),
  });
  const resume = useMutation({
    mutationFn: () => resumeTimer(session!.id),
    onSuccess: () => {
      invalidate();
      toast.success("Timer resumed");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not resume the timer.")),
  });
  const stop = useMutation({
    mutationFn: () => stopTimer(session!.id),
    onSuccess: () => {
      invalidate();
      toast.success("Time entry saved");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not stop the timer.")),
  });

  const pending = start.isPending || pause.isPending || resume.isPending || stop.isPending;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-3xl tabular-nums">{formatDuration(onThisTask || !taskId ? elapsed : 0)}</p>
          <p className="mt-1 text-sm text-slate-400">
            {session
              ? `${session.status} · ${session.task?.title ?? taskTitle ?? "Active task"}`
              : taskTitle ?? "No timer running"}
          </p>
        </div>
        {session && <Badge tone={session.status === "running" ? "green" : "yellow"}>{session.status}</Badge>}
      </div>
      <div className="flex flex-wrap gap-2">
        {(!session || (taskId && !onThisTask)) && (
          <Button size="sm" disabled={!taskId || pending} onClick={() => start.mutate()}>
            Start timer
          </Button>
        )}
        {session && (onThisTask || !taskId) && session.status === "running" && (
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => pause.mutate()}>
            Pause
          </Button>
        )}
        {session && (onThisTask || !taskId) && session.status === "paused" && (
          <Button size="sm" disabled={pending} onClick={() => resume.mutate()}>
            Resume
          </Button>
        )}
        {session && (onThisTask || !taskId) && (
          <Button size="sm" variant="danger" disabled={pending} onClick={() => stop.mutate()}>
            Stop
          </Button>
        )}
      </div>
    </div>
  );
}
