"use client";

import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api";
import { acceptTask, declineTask, getPendingAssignments } from "@/services/tasks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AssignmentInboxModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pending = useQuery({
    queryKey: ["assignments", "pending"],
    queryFn: getPendingAssignments,
    refetchInterval: 15_000,
  });

  const task = pending.data?.[0];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const accept = useMutation({
    mutationFn: () => acceptTask(task!.id),
    onSuccess: () => {
      refresh();
      toast.success("Task received");
      router.push(`/tasks/${task!.id}`);
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not accept.")),
  });
  const decline = useMutation({
    mutationFn: () => declineTask(task!.id),
    onSuccess: () => {
      refresh();
      toast.success("Task declined. The assigner will see this.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not decline.")),
  });

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/80 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">New assignment</p>
        <h2 className="mt-2 text-xl font-semibold text-white">A task was assigned to you</h2>
        <p className="mt-3 text-sm text-slate-300">{task.title}</p>
        <p className="mt-1 text-xs text-slate-400">
          {task.project?.name ?? `Project #${task.project_id}`}
          {task.assignment?.assigned_by?.name ? ` · from ${task.assignment.assigned_by.name}` : ""}
          {task.estimated_hours ? ` · ${task.estimated_hours}h allocated` : ""}
        </p>
        {(pending.data?.length ?? 0) > 1 && (
          <p className="mt-2 text-xs text-amber-200">{pending.data!.length - 1} more waiting after this one.</p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button disabled={accept.isPending || decline.isPending} onClick={() => accept.mutate()}>
            Receive
          </Button>
          <Button variant="danger" disabled={accept.isPending || decline.isPending} onClick={() => decline.mutate()}>
            Decline
          </Button>
          <Button variant="secondary" onClick={() => router.push(`/tasks/${task.id}`)}>
            Open details
          </Button>
        </div>
      </div>
    </div>
  );
}
