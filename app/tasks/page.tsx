"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { listTasks } from "@/services/tasks";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

function assignmentLabel(status?: string | null) {
  if (status === "pending") return "Waiting to receive";
  if (status === "accepted") return "Received";
  if (status === "declined") return "Declined";
  return null;
}

export default function TasksPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["tasks", search],
    queryFn: () => listTasks(search ? { search } : undefined),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Work</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Tasks</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Project work lives here. Open a task to track time, upload files, and update status. Time reports stay on the Time page.
        </p>
      </div>
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
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="flex flex-col gap-2 rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-white">{task.title}</p>
                <p className="mt-1 truncate text-xs text-slate-400">
                  {task.project?.name ?? `Project #${task.project_id}`}
                  {task.description ? ` · ${task.description}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{task.status.replace("_", " ")}</Badge>
                {assignmentLabel(task.assignment_status ?? task.assignment?.status) && (
                  <Badge tone={task.assignment_status === "pending" ? "yellow" : "cyan"}>
                    {assignmentLabel(task.assignment_status ?? task.assignment?.status)}
                  </Badge>
                )}
                <span className="text-xs text-slate-400">{task.estimated_hours ?? 0}h allocated</span>
                <span className="text-xs text-slate-500">{task.assignee?.name ?? "Unassigned"}</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
