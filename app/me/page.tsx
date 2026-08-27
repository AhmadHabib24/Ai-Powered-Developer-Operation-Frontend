"use client";

import { StatTile } from "@/components/dashboard/stat-tile";
import { TimerPanel } from "@/components/time/timer-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api";
import { cn, formatHours } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { getDeveloperDashboard } from "@/services/dashboards";
import { listGitIdentities, saveGitIdentity } from "@/services/git";
import { changeTaskStatus } from "@/services/tasks";
import { getCurrentSession, setWorkMode, startTimer } from "@/services/time";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock, GitBranch, ListTodo, Trophy } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function DeveloperHomePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["dashboard", "developer"], queryFn: getDeveloperDashboard });
  const { data: current } = useQuery({ queryKey: ["time", "current"], queryFn: getCurrentSession });
  const { data: identities } = useQuery({ queryKey: ["git", "identities"], queryFn: listGitIdentities });
  const [githubLogin, setGithubLogin] = useState("");
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

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

  if (isLoading) return <p className="text-muted">Loading your work…</p>;
  if (isError || !data) return <p className="text-rose-700 dark:text-rose-300">Could not load your workspace.</p>;

  const session = current?.session ?? data.timer.active;
  const workMode = current?.work_mode ?? data.timer.work_mode;
  const timerRequired = current?.timer_required ?? data.timer.timer_required;
  const todaySeconds = data.timer.today_seconds + (session?.elapsed_seconds ?? 0);
  const weekSeconds = data.timer.week_seconds + (session?.elapsed_seconds ?? 0);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-50 via-card to-orange-50 p-6 dark:from-[#16110a] dark:via-card dark:to-[#0b1220]">
        <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">Developer workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {greeting}, {user?.name?.split(" ")[0] ?? "there"}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted">Today’s work, live time, and the tasks waiting on you.</p>
          </div>
          <Link className="text-sm text-amber-700 dark:text-amber-300" href="/tasks">
            All tasks
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Assigned" value={data.tasks.assigned} icon={ListTodo} tone="gold" />
        <StatTile label="Blocked" value={data.tasks.blocked} icon={AlertTriangle} tone="red" />
        <StatTile label="Today" value={formatHours(todaySeconds)} icon={Clock} tone="green" />
        <StatTile label="This week" value={formatHours(weekSeconds)} icon={Clock} tone="gold" />
        <StatTile
          label="Score"
          value={data.performance.score ?? "—"}
          hint={`${data.performance.points} pts this week`}
          icon={Trophy}
          tone="slate"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_12px_40px_rgba(28,25,23,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Work mode</h2>
              <p className="text-xs text-muted">Office or remote for today’s sessions</p>
            </div>
            <Badge tone={workMode === "remote" ? "gold" : "slate"}>{workMode}</Badge>
          </div>
          {timerRequired && !session && (
            <p className="mb-3 text-sm text-amber-800 dark:text-amber-200">Remote work requires a running timer while you are on a task.</p>
          )}
          <div className="inline-flex rounded-xl border border-border bg-foreground/5 p-1">
            {(["office", "remote"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={modeMutation.isPending}
                onClick={() => modeMutation.mutate(mode)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm capitalize transition",
                  workMode === mode
                    ? mode === "remote"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 font-medium text-stone-950 shadow-[0_0_18px_rgba(249,115,22,0.35)]"
                      : "bg-card font-medium text-foreground shadow-sm"
                    : "text-muted hover:text-foreground",
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-card p-5 shadow-[0_12px_40px_rgba(28,25,23,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-400/10 to-transparent" />
          <h2 className="relative text-lg font-semibold text-foreground">Live timer</h2>
          <div className="relative mt-4">
            <TimerPanel
              size="hero"
              session={session}
              taskId={session?.task_id ?? data.tasks.in_progress[0]?.id}
              taskTitle={session?.task?.title}
            />
          </div>
        </section>
      </div>

      {(data.tasks.pending_assignments ?? []).length > 0 && (
        <section className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5">
          <h2 className="text-lg font-semibold text-foreground">Waiting for you</h2>
          <p className="mt-1 text-sm text-muted">Receive or decline these assignments. They also appear as a popup after login.</p>
          <div className="mt-4 space-y-2">
            {data.tasks.pending_assignments!.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="block rounded-xl border border-border bg-card px-4 py-3 hover:border-amber-400/40">
                <p className="font-medium text-foreground">{task.title}</p>
                <p className="text-xs text-muted">{task.project?.name ?? `Project #${task.project_id}`}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground">In progress</h2>
        <div className="mt-4 space-y-2">
          {data.tasks.in_progress.length === 0 && <p className="text-sm text-muted">Nothing in progress. Pick a task below.</p>}
          {data.tasks.in_progress.map((task) => (
            <div key={task.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href={`/tasks/${task.id}`} className="font-medium text-foreground hover:text-amber-700 dark:hover:text-amber-200">
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
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">My tasks</h2>
          <div className="mt-4 space-y-2">
            {data.tasks.recent.length === 0 && <p className="text-sm text-muted">No tasks assigned yet.</p>}
            {data.tasks.recent.map((task) => (
              <div key={task.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/tasks/${task.id}`} className="font-medium text-foreground hover:text-amber-700 dark:hover:text-amber-200">
                    {task.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {task.project?.name ?? `Project #${task.project_id}`} · {task.estimated_hours ?? 0}h estimate
                    {task.assignment_status === "pending" ? " · waiting for you to receive" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{task.status.replace("_", " ")}</Badge>
                  {session?.task_id === task.id && <Badge tone="green">Timing</Badge>}
                  {["todo", "in_progress", "blocked", "in_review", "qa"].includes(task.status) &&
                    session?.task_id !== task.id &&
                    task.assignment_status !== "pending" && (
                      <Button size="sm" onClick={() => startMutation.mutate(task.id)} disabled={startMutation.isPending}>
                        Start timer
                      </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">Achievements</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(data.performance.achievements ?? []).length === 0 && (
                <p className="text-sm text-muted">None earned yet. They come from scoring rules, not from labels.</p>
              )}
              {(data.performance.achievements ?? []).map((item) => (
                <Badge key={item.slug ?? item.name ?? "a"} tone="gold">
                  {item.name}
                </Badge>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              <h2 className="text-lg font-semibold text-foreground">GitHub identity</h2>
            </div>
            <p className="text-sm text-muted">
              Commits and PRs are matched to you by email or this username. Use the same login as GitHub.
            </p>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
              {identities?.[0]?.login ? `Linked as ${identities[0].login}` : "No GitHub login linked yet."}
            </p>
            <div className="mt-3 flex gap-2">
              <input
                className="h-10 flex-1 rounded-lg border border-border bg-foreground/5 px-3 text-sm text-foreground placeholder:text-muted"
                placeholder="GitHub username"
                value={githubLogin}
                onChange={(event) => setGithubLogin(event.target.value)}
              />
              <Button size="sm" disabled={!githubLogin || identityMutation.isPending} onClick={() => identityMutation.mutate()}>
                Link
              </Button>
            </div>
            {data.git && (
              <p className="mt-3 text-xs text-muted">
                {data.git.commits_week} commit(s) this week · {data.git.open_prs} open PR(s) · {data.git.open_findings} open review finding(s).
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
