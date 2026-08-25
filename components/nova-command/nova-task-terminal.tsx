"use client";

import { MeshTerminal } from "@/components/nova-command/mesh-terminal";
import { apiErrorMessage } from "@/lib/api";
import { getTaskBoard, type TheaterTask } from "@/services/activity";
import { useQuery } from "@tanstack/react-query";

function TaskLines({
  heading,
  rows,
  onOpen,
}: {
  heading: string;
  rows: TheaterTask[];
  onOpen: (id: number) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-500">{heading}</p>
      {rows.length === 0 && <p className="text-cyan-800">none</p>}
      {rows.map((task) => (
        <button
          key={`${heading}-${task.id}`}
          type="button"
          onClick={() => onOpen(task.id)}
          className="block w-full truncate text-left text-cyan-100 hover:text-white"
        >
          <span className="text-cyan-700">›</span> {task.timer ? "TIMER " : ""}
          {task.assignee ?? "unassigned"} · {task.title}
          {task.project ? ` · ${task.project}` : ""}
        </button>
      ))}
    </div>
  );
}

export function NovaTaskTerminal({ enabled, onOpenTask }: { enabled: boolean; onOpenTask: (id: number) => void }) {
  const board = useQuery({
    queryKey: ["activity", "tasks"],
    queryFn: getTaskBoard,
    enabled,
    refetchInterval: enabled ? 5000 : false,
  });

  const data = board.data;

  return (
    <MeshTerminal title="Task mesh" liveLabel={board.isFetching ? "sync" : "live"} className="h-full min-h-0 lg:min-h-[280px]">
      {board.error && <p className="text-rose-300">{apiErrorMessage(board.error, "Task uplink denied.")}</p>}
      {data && (
        <div className="space-y-4">
          <p className="text-cyan-500">
            {data.counts.timers} timer · {data.counts.working} in progress · {data.counts.pending} pending · {data.counts.blocked}{" "}
            blocked · {data.counts.done} done
          </p>
          <TaskLines heading="Working now" rows={data.working} onOpen={onOpenTask} />
          <TaskLines heading="Pending" rows={data.pending} onOpen={onOpenTask} />
          <TaskLines heading="Review / QA" rows={data.review} onOpen={onOpenTask} />
          <TaskLines heading="Blocked" rows={data.blocked} onOpen={onOpenTask} />
          <TaskLines heading="Recently done" rows={data.done} onOpen={onOpenTask} />
        </div>
      )}
    </MeshTerminal>
  );
}
