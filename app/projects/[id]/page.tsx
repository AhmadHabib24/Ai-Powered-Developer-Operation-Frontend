"use client";

import { ProjectGitPanel } from "@/components/git/project-git-panel";
import { ProjectRequirementsPanel } from "@/components/requirements/project-requirements-panel";
import { ProjectReviewsPanel } from "@/components/reviews/project-reviews-panel";
import { ProjectRulesPanel } from "@/components/reviews/project-rules-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { taskSchema } from "@/schemas/auth";
import { createTask, getProject, listProjectTasks } from "@/services/projects";
import { assignTask, changeTaskStatus } from "@/services/tasks";
import { listUsers } from "@/services/users";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const { data: project, isLoading } = useQuery({ queryKey: ["project", params.id], queryFn: () => getProject(params.id) });
  const { data: tasks } = useQuery({ queryKey: ["project-tasks", params.id], queryFn: () => listProjectTasks(params.id) });
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => listUsers(),
    enabled: can("users.view"),
  });
  const form = useForm<z.infer<typeof taskSchema>>({ resolver: zodResolver(taskSchema), defaultValues: { priority: "medium" } });

  const createMutation = useMutation({
    mutationFn: (values: z.infer<typeof taskSchema>) => createTask(params.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks", params.id] });
      form.reset({ priority: "medium" });
      toast.success("Task created");
    },
  });

  if (isLoading || !project) return <p className="text-slate-400">Loading project…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Project</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">{project.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">{project.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can("ai.use") && (
            <Button variant="secondary" asChild>
              <Link href={`/nova?project_id=${project.id}`}>Talk to NOVA</Link>
            </Button>
          )}
          <Badge>{project.status}</Badge>
          <Badge tone={project.health}>{project.health}</Badge>
        </div>
      </div>
      <Card>
        <CardTitle>Why this health</CardTitle>
        <p className="mt-2 text-sm text-slate-300">{project.health_reason}</p>
        <p className="mt-2 text-xs text-slate-500">Deadline {formatDate(project.deadline)}</p>
      </Card>
      {can("tasks.create") && (
        <Card>
          <CardTitle>Add task</CardTitle>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
            <Input placeholder="Task title" {...form.register("title")} />
            <Input type="number" step="0.5" placeholder="Estimated hours" {...form.register("estimated_hours")} />
            <Input type="date" {...form.register("due_date")} />
            <select className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm" {...form.register("priority")}>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <textarea className="md:col-span-2 min-h-20 rounded-lg border border-white/10 bg-white/5 p-3 text-sm" placeholder="Description" {...form.register("description")} />
            <Button disabled={createMutation.isPending}>Create task</Button>
          </form>
        </Card>
      )}
      <ProjectRequirementsPanel projectId={params.id} />
      <ProjectRulesPanel projectId={params.id} project={project} />
      <ProjectReviewsPanel projectId={params.id} />
      <Suspense fallback={<p className="text-sm text-slate-400">Loading GitHub…</p>}>
        <ProjectGitPanel projectId={params.id} />
      </Suspense>
      <Card>
        <CardTitle>Tasks</CardTitle>
        <div className="mt-4 space-y-2">
          {tasks?.data.map((task) => (
            <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3">
              <div>
                <Link href={`/tasks/${task.id}`} className="font-medium hover:text-cyan-200">
                  {task.title}
                </Link>
                <p className="text-xs text-slate-400">{task.assignee?.name ?? "Unassigned"} · {task.estimated_hours ?? 0}h</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={task.is_overdue ? "red" : "slate"}>{task.status.replace("_", " ")}</Badge>
                {can("tasks.update") && (
                  <select
                    className="h-8 rounded-lg border border-white/10 bg-slate-950 px-2 text-xs"
                    defaultValue={task.status}
                    onChange={(event) =>
                      changeTaskStatus(task.id, event.target.value).then(() => {
                        queryClient.invalidateQueries({ queryKey: ["project-tasks", params.id] });
                      })
                    }
                  >
                    {["backlog", "todo", "in_progress", "blocked", "in_review", "qa", "done", "cancelled"].map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                )}
                {can("tasks.assign") && (
                  <select
                    className="h-8 rounded-lg border border-white/10 bg-slate-950 px-2 text-xs"
                    defaultValue={task.assignee?.id ?? ""}
                    onChange={(event) => {
                      if (!event.target.value) return;
                      assignTask(task.id, Number(event.target.value)).then(() => {
                        queryClient.invalidateQueries({ queryKey: ["project-tasks", params.id] });
                        toast.success("Assigned");
                      });
                    }}
                  >
                    <option value="">Assign</option>
                    {(users?.data ?? project.members ?? []).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
          {tasks?.data.length === 0 && <p className="text-sm text-slate-400">No tasks yet.</p>}
        </div>
      </Card>
    </div>
  );
}
