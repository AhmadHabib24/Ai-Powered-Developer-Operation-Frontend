"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { projectSchema } from "@/schemas/auth";
import { createProject } from "@/services/projects";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

export default function NewProjectPage() {
  const { can, isLoading } = useAuth();
  const router = useRouter();
  const form = useForm<z.infer<typeof projectSchema>>({ resolver: zodResolver(projectSchema) });
  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      toast.success("Project created");
      router.push(`/projects/${project.id}`);
    },
    onError: () => toast.error("Could not create project"),
  });

  if (isLoading) return <p className="text-slate-400">Loading…</p>;
  if (!can("projects.create")) {
    return <p className="text-rose-300">You do not have permission to create projects.</p>;
  }

  return (
    <Card className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-semibold">Create project</h1>
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <label className="mb-1 block text-sm text-slate-300">Project name</label>
          <Input placeholder="AI Chat Bot" {...form.register("name")} />
          {form.formState.errors.name && <p className="mt-1 text-xs text-rose-300">{form.formState.errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300">Description</label>
          <textarea
            className="min-h-28 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
            placeholder="What this project delivers"
            {...form.register("description")}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-300">Deadline</label>
          <Input type="date" {...form.register("deadline")} />
          <p className="mt-1 text-xs text-slate-500">Target delivery date — not the created-on date. Health turns red if this date passes while work is still open.</p>
        </div>
        <Button disabled={mutation.isPending}>{mutation.isPending ? "Creating…" : "Create project"}</Button>
      </form>
    </Card>
  );
}
