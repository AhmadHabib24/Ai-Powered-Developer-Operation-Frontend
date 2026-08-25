"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { TimerPanel } from "@/components/time/timer-panel";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { recommendAssignee } from "@/services/requirements";
import { addComment, changeTaskStatus, getTask } from "@/services/tasks";
import { getCurrentSession } from "@/services/time";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const [body, setBody] = useState("");
  const { data: task, isLoading } = useQuery({ queryKey: ["task", params.id], queryFn: () => getTask(params.id) });
  const { data: current } = useQuery({ queryKey: ["time", "current"], queryFn: getCurrentSession });

  const recommend = useMutation({
    mutationFn: (apply: boolean) => recommendAssignee(params.id, apply),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["task", params.id] });
      toast.success(
        result.auto_assigned
          ? `Assigned to ${result.recommended?.name}`
          : `Suggested ${result.recommended?.name} (${Math.round((result.recommended?.confidence ?? 0) * 100)}%)`,
      );
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Recommendation failed")),
  });
  const commentMutation = useMutation({
    mutationFn: () => addComment(params.id, body),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["task", params.id] });
      toast.success("Comment added");
    },
  });

  if (isLoading || !task) return <p className="text-slate-400">Loading task…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold sm:text-3xl">{task.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">{task.description}</p>
        </div>
        <Badge>{task.status.replace("_", " ")}</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>Assignee</CardTitle>
          <p className="mt-2">{task.assignee?.name ?? "Unassigned"}</p>
          {task.suggested_assignee && (
            <p className="mt-2 text-xs text-cyan-200">
              Suggested {task.suggested_assignee.name}
              {task.assignment_confidence ? ` · ${task.assignment_confidence}` : ""}
            </p>
          )}
          {task.assignment_reason && <p className="mt-1 text-xs text-slate-400">{task.assignment_reason}</p>}
          {can("tasks.assign") && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" disabled={recommend.isPending} onClick={() => recommend.mutate(false)}>
                Recommend
              </Button>
              <Button size="sm" disabled={recommend.isPending} onClick={() => recommend.mutate(true)}>
                Recommend and apply
              </Button>
            </div>
          )}
        </Card>
        <Card><CardTitle>Priority</CardTitle><p className="mt-2 capitalize">{task.priority}</p></Card>
        <Card><CardTitle>Estimate / actual</CardTitle><p className="mt-2">{task.estimated_hours ?? 0}h / {task.actual_hours ?? 0}h</p></Card>
      </div>
      {["todo", "in_progress", "blocked", "in_review", "qa"].includes(task.status) && (
        <Card>
          <CardTitle>Timer</CardTitle>
          <div className="mt-4">
            <TimerPanel session={current?.session ?? null} taskId={task.id} taskTitle={task.title} />
          </div>
        </Card>
      )}
      {task.acceptance_criteria && (
        <Card>
          <CardTitle>Acceptance criteria</CardTitle>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{task.acceptance_criteria}</p>
        </Card>
      )}
      <Card className="flex flex-wrap gap-2">
        {["in_progress", "blocked", "in_review", "done"].map((status) => (
          <Button
            key={status}
            variant="secondary"
            size="sm"
            onClick={() =>
              changeTaskStatus(task.id, status).then(() => {
                queryClient.invalidateQueries({ queryKey: ["task", params.id] });
                toast.success("Status updated");
              })
            }
          >
            Mark {status.replace("_", " ")}
          </Button>
        ))}
      </Card>
      <Card>
        <CardTitle>Comments</CardTitle>
        <div className="mt-3 space-y-3">
          {task.comments?.map((comment) => (
            <div key={comment.id} className="rounded-lg bg-white/5 p-3 text-sm">
              <p className="text-xs text-slate-400">{comment.user?.name}</p>
              <p>{comment.body}</p>
            </div>
          ))}
        </div>
        <textarea className="mt-4 min-h-24 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
        <Button className="mt-3" disabled={!body || commentMutation.isPending} onClick={() => commentMutation.mutate()}>
          Comment
        </Button>
      </Card>
    </div>
  );
}
