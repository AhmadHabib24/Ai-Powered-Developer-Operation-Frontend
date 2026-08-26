"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { TimerPanel } from "@/components/time/timer-panel";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { recommendAssignee } from "@/services/requirements";
import { acceptTask, addComment, addTaskAttachment, changeTaskStatus, declineTask, getTask } from "@/services/tasks";
import { getCurrentSession } from "@/services/time";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user, can } = useAuth();
  const [body, setBody] = useState("");
  const { data: task, isLoading } = useQuery({ queryKey: ["task", params.id], queryFn: () => getTask(params.id) });
  const { data: current } = useQuery({ queryKey: ["time", "current"], queryFn: getCurrentSession });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["task", params.id] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
  };

  const recommend = useMutation({
    mutationFn: (apply: boolean) => recommendAssignee(params.id, apply),
    onSuccess: (result) => {
      invalidate();
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
      invalidate();
      toast.success("Comment added");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not comment.")),
  });
  const accept = useMutation({
    mutationFn: () => acceptTask(params.id),
    onSuccess: () => {
      invalidate();
      toast.success("Task received");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not accept.")),
  });
  const decline = useMutation({
    mutationFn: () => declineTask(params.id),
    onSuccess: () => {
      invalidate();
      toast.success("Task declined");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not decline.")),
  });
  const upload = useMutation({
    mutationFn: (file: File) => addTaskAttachment(params.id, file),
    onSuccess: () => {
      invalidate();
      toast.success("File uploaded");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Upload failed.")),
  });

  if (isLoading || !task) return <p className="text-slate-400">Loading task…</p>;

  const assignmentStatus = task.assignment_status ?? task.assignment?.status;
  const pendingForMe = assignmentStatus === "pending" && task.assignee?.id === user?.id;
  const accepted = assignmentStatus === "accepted" || (!assignmentStatus && Boolean(task.assignee));
  const canTime = accepted && ["todo", "in_progress", "blocked", "in_review", "qa"].includes(task.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {task.project && (
            <Link href={`/projects/${task.project.id}`} className="text-sm text-cyan-300">
              {task.project.name}
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{task.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">{task.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{task.status.replace("_", " ")}</Badge>
          {assignmentStatus && (
            <Badge tone={assignmentStatus === "pending" ? "yellow" : assignmentStatus === "declined" ? "red" : "green"}>
              {assignmentStatus === "pending" ? "waiting to receive" : assignmentStatus}
            </Badge>
          )}
        </div>
      </div>

      {pendingForMe && (
        <Card>
          <CardTitle>This task was assigned to you</CardTitle>
          <p className="mt-2 text-sm text-slate-400">
            {task.assignment?.assigned_by?.name ?? "Someone"} assigned this work. Receive it to start, or decline so the assigner can see your decision.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled={accept.isPending} onClick={() => accept.mutate()}>
              Receive
            </Button>
            <Button variant="danger" disabled={decline.isPending} onClick={() => decline.mutate()}>
              Decline
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>Assignee</CardTitle>
          <p className="mt-2">{task.assignee?.name ?? "Unassigned"}</p>
          {task.assignment?.assigned_by && (
            <p className="mt-1 text-xs text-slate-400">Assigned by {task.assignment.assigned_by.name}</p>
          )}
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
        <Card>
          <CardTitle>Priority</CardTitle>
          <p className="mt-2 capitalize">{task.priority}</p>
        </Card>
        <Card>
          <CardTitle>Time allocated</CardTitle>
          <p className="mt-2">
            {task.estimated_hours ?? 0}h estimate / {task.actual_hours ?? 0}h actual
          </p>
        </Card>
      </div>

      {canTime && (
        <Card>
          <CardTitle>Timer</CardTitle>
          <p className="mt-2 text-sm text-slate-400">Starting the timer marks this task as working.</p>
          <div className="mt-4">
            <TimerPanel session={current?.session ?? null} taskId={task.id} taskTitle={task.title} />
          </div>
        </Card>
      )}

      {pendingForMe && (
        <p className="text-sm text-amber-200">Receive the assignment before you can run the timer.</p>
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
            disabled={pendingForMe}
            onClick={() =>
              changeTaskStatus(task.id, status).then(() => {
                invalidate();
                toast.success("Status updated");
              })
            }
          >
            Mark {status.replace("_", " ")}
          </Button>
        ))}
      </Card>

      <Card>
        <CardTitle>Files</CardTitle>
        <div className="mt-3 space-y-2">
          {(task.attachments ?? []).length === 0 && <p className="text-sm text-slate-400">No files yet.</p>}
          {(task.attachments ?? []).map((file) => (
            <div key={file.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
              {file.original_name} · {Math.round(file.size_bytes / 1024)} KB
            </div>
          ))}
        </div>
        {can("tasks.update") && (
          <input
            type="file"
            className="mt-4 text-sm text-slate-300"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload.mutate(file);
              event.target.value = "";
            }}
          />
        )}
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
