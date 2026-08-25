"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { projectSchema } from "@/schemas/auth";
import { createProject } from "@/services/projects";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

export default function NewProjectPage() {
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

  return (
    <Card className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-semibold">Create project</h1>
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Input placeholder="Project name" {...form.register("name")} />
        <textarea
          className="min-h-28 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
          placeholder="Description"
          {...form.register("description")}
        />
        <Input type="date" {...form.register("deadline")} />
        <Button disabled={mutation.isPending}>{mutation.isPending ? "Creating…" : "Create project"}</Button>
      </form>
    </Card>
  );
}
