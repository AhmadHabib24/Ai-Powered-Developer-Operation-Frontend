"use client";

import { TimerPanel } from "@/components/time/timer-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/api";
import { formatHours } from "@/lib/utils";
import { getDeveloperDashboard } from "@/services/dashboards";
import { changeTaskStatus } from "@/services/tasks";
import { listGitIdentities, saveGitIdentity } from "@/services/git";
import { getCurrentSession, setWorkMode, startTimer } from "@/services/time";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function DeveloperHomePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["dashboard", "developer"], queryFn: getDeveloperDashboard });
  const { data: current } = useQuery({ queryKey: ["time", "current"], queryFn: getCurrentSession });
  const { data: identities } = useQuery({ queryKey: ["git", "identities"], queryFn: listGitIdentities });
  const [githubLogin, setGithubLogin] = useState("");
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => changeTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "developer"] });
      toast.success("Task updated");
    },
  });
  const modeMutation = useMutation({
    mutationFn: (work_mode: "office" | "remote") => setWorkMode(work_mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "developer"] });
      toast.success("Work mode updated");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not update work mode.")),
  });
  const identityMutation = useMutation({
    mutationFn: () => saveGitIdentity(githubLogin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["git", "identities"] });
      setGithubLogin("");
      toast.success("GitHub username linked");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not link GitHub.")),
  });
  const startMutation = useMutation({
    mutationFn: (taskId: number) => startTimer(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "developer"] });
      toast.success("Timer started");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not start the timer.")),
  });

  if (isLoading || !data) return <p className="text-slate-400">Loading your work…</p>;

  const session = current?.session ?? data.timer.active;
  const workMode = current?.work_mode ?? data.timer.work_mode;
  const timerRequired = current?.timer_required ?? data.timer.timer_required;
  const todaySeconds = data.timer.today_seconds + (session?.elapsed_seconds ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Developer workspace</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Today’s work</h1>
        </div>
        <Link className="text-sm text-amber-300" href="/tasks">
          All tasks
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardTitle>Assigned</CardTitle>
          <p className="mt-2 text-3xl">{data.tasks.assigned}</p>
        </Card>
        <Card>
          <CardTitle>Blocked</CardTitle>
          <p className="mt-2 text-3xl">{data.tasks.blocked}</p>
        </Card>
        <Card>
          <CardTitle>Today</CardTitle>
          <p className="mt-2 text-3xl">{formatHours(todaySeconds)}</p>
        </Card>
        <Card>
          <CardTitle>This week</CardTitle>
          <p className="mt-2 text-3xl">{formatHours(data.timer.week_seconds + (session?.elapsed_seconds ?? 0))}</p>
        </Card>
        <Card>
          <CardTitle>Score</CardTitle>
          <p className="mt-2 text-3xl">{data.performance.score ?? "—"}</p>
          <p className="mt-1 text-xs text-slate-500">{data.performance.points} pts this week</p>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Work mode</CardTitle>
            <Badge tone={workMode === "remote" ? "cyan" : "slate"}>{workMode}</Badge>
          </div>
          {timerRequired && !session && (
            <p className="mb-3 text-sm text-amber-200">Remote work requires a running timer while you are on a task.</p>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant={workMode === "office" ? "default" : "secondary"} onClick={() => modeMutation.mutate("office")}>
              Office
            </Button>
            <Button size="sm" variant={workMode === "remote" ? "default" : "secondary"} onClick={() => modeMutation.mutate("remote")}>
              Remote
            </Button>
          </div>
        </Card>
        <Card>
          <CardTitle>Live timer</CardTitle>
          <div className="mt-4">
            <TimerPanel session={session} taskId={session?.task_id ?? data.tasks.in_progress[0]?.id} taskTitle={session?.task?.title} />
          </div>
        </Card>
      </div>
      {(data.tasks.pending_assignments ?? []).length > 0 && (
        <Card>
          <CardTitle>Waiting for you</CardTitle>
          <p className="mt-2 text-sm text-slate-400">Receive or decline these assignments. They also appear as a popup after login.</p>
          <div className="mt-4 space-y-2">
            {data.tasks.pending_assignments!.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="block rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10">
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-slate-400">{task.project?.name ?? `Project #${task.project_id}`}</p>
              </Link>
            ))}
          </div>
        </Card>
      )}
      <Card>
        <CardTitle>In progress</CardTitle>
        <div className="mt-4 space-y-2">
          {data.tasks.in_progress.length === 0 && <p className="text-sm text-slate-400">Nothing in progress. Pick a task below.</p>}
          {data.tasks.in_progress.map((task) => (
            <div key={task.id} className="flex flex-col gap-3 rounded-xl bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href={`/tasks/${task.id}`} className="font-medium hover:text-amber-200">
                {task.title}
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                {session?.task_id !== task.id && (
                  <Button size="sm" onClick={() => startMutation.mutate(task.id)} disabled={startMutation.isPending}>
                    Start timer
                  </Button>
                )}
                {session?.task_id === task.id && <Badge tone="green">Timing</Badge>}
                <Button size="sm" variant="secondary" onClick={() => statusMutation.mutate({ id: task.id, status: "in_review" })}>
                  Submit for review
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle>My tasks</CardTitle>
        <div className="mt-4 space-y-2">
          {data.tasks.recent.map((task) => (
            <div key={task.id} className="flex flex-col gap-3 rounded-xl bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/tasks/${task.id}`} className="font-medium hover:text-amber-200">
                  {task.title}
                </Link>
                <p className="text-xs text-slate-400">
                  {task.project?.name ?? `Project #${task.project_id}`} · {task.estimated_hours ?? 0}h estimate
                  {task.assignment_status === "pending" ? " · waiting for you to receive" : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{task.status.replace("_", " ")}</Badge>
                {session?.task_id === task.id && <Badge tone="green">Timing</Badge>}
                {["todo", "in_progress", "blocked", "in_review", "qa"].includes(task.status) && session?.task_id !== task.id && task.assignment_status !== "pending" && (
                  <Button size="sm" onClick={() => startMutation.mutate(task.id)} disabled={startMutation.isPending}>
                    Start timer
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle>Achievements</CardTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {(data.performance.achievements ?? []).length === 0 && (
            <p className="text-sm text-slate-400">None earned yet. They come from scoring rules, not from labels.</p>
          )}
          {(data.performance.achievements ?? []).map((item) => (
            <Badge key={item.slug ?? item.name ?? "a"} tone="cyan">
              {item.name}
            </Badge>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle>GitHub identity</CardTitle>
        <p className="mt-2 text-sm text-slate-400">
          Commits and PRs are matched to you by email or this username. Use the same login as GitHub.
        </p>
        <p className="mt-2 text-sm text-amber-200">
          {identities?.[0]?.login ? `Linked as ${identities[0].login}` : "No GitHub login linked yet."}
        </p>
        <div className="mt-3 flex gap-2">
          <input
            className="h-10 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
            placeholder="GitHub username"
            value={githubLogin}
            onChange={(event) => setGithubLogin(event.target.value)}
          />
          <Button size="sm" disabled={!githubLogin || identityMutation.isPending} onClick={() => identityMutation.mutate()}>
            Link
          </Button>
        </div>
        {data.git && (
          <p className="mt-3 text-xs text-slate-500">
            {data.git.commits_week} commit(s) this week · {data.git.open_prs} open PR(s) · {data.git.open_findings} open review finding(s).
          </p>
        )}
      </Card>
    </div>
  );
}
