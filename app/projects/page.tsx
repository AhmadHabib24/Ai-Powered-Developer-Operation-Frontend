"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate, timeAgo } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { listProjects } from "@/services/projects";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

const ACTIVITY_LABEL: Record<string, string> = {
  comment: "New comment",
  file: "File submitted",
  timer: "Timer activity",
  time_request: "Time request",
  time_extended: "Time extended",
  time_rejected: "Time declined",
  over_time: "Over allocated time",
  project: "Updated",
};

export default function ProjectsPage() {
  const { can, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects(),
    enabled: can("projects.view"),
    refetchInterval: 8000,
  });

  if (authLoading) return <p className="text-slate-400">Loading projects…</p>;
  if (!can("projects.view")) {
    return <p className="text-rose-300">You do not have permission to view this.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Projects</h1>
          <p className="text-sm text-slate-400">Live work, new files, comments, and overtime rise to the top.</p>
        </div>
        {can("projects.create") && (
          <Button asChild>
            <Link href="/projects/new">New project</Link>
          </Button>
        )}
      </div>
      {isLoading && <p className="text-slate-400">Loading projects…</p>}
      <div className="grid gap-4">
        {data?.data.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="flex flex-col gap-3 hover:border-amber-400/30 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-lg font-medium">{project.name}</p>
                <p className="text-sm text-slate-400">{project.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {project.last_activity_kind
                    ? `${ACTIVITY_LABEL[project.last_activity_kind] ?? project.last_activity_kind} ${timeAgo(project.last_activity_at)}`
                    : `Deadline ${formatDate(project.deadline)}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {project.has_live_timer && <Badge tone="green">Timer live</Badge>}
                {(project.overtime_count ?? 0) > 0 && <Badge tone="red">Over time</Badge>}
                <Badge>{project.status}</Badge>
                <Badge tone={project.health}>{project.health}</Badge>
              </div>
            </Card>
          </Link>
        ))}
        {data?.data.length === 0 && <Card>No projects yet.</Card>}
      </div>
    </div>
  );
}
