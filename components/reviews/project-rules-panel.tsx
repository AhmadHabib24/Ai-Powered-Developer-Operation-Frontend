"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { updateProject } from "@/services/projects";
import { createProjectRule, listProjectRules, updateProjectRule } from "@/services/reviews";
import type { Project } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function ProjectRulesPanel({ projectId, project }: { projectId: string; project?: Project }) {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [ruleText, setRuleText] = useState("");
  const [category, setCategory] = useState("architecture");
  const [stack, setStack] = useState("general");

  const { data: rules } = useQuery({
    queryKey: ["project-rules", projectId],
    queryFn: () => listProjectRules(projectId),
  });

  const create = useMutation({
    mutationFn: () => createProjectRule(projectId, { title, rule_text: ruleText, category, stack }),
    onSuccess: () => {
      setTitle("");
      setRuleText("");
      queryClient.invalidateQueries({ queryKey: ["project-rules", projectId] });
      toast.success("Rule added");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not add the rule.")),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => updateProjectRule(projectId, id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-rules", projectId] }),
  });

  const policy = useMutation({
    mutationFn: (payload: { ai_review_enabled?: boolean; auto_block_on_severity?: string | null }) => updateProject(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Review policy updated");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not update review policy.")),
  });

  return (
    <Card>
      <CardTitle>Coding rules</CardTitle>
      <p className="mt-2 text-sm text-slate-400">
        NOVA reviews pushes and pull requests against these rules. Findings are advisory unless you enable a merge gate.
      </p>
      {can("projects.update") && project && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={project.ai_review_enabled !== false}
              onChange={(event) => policy.mutate({ ai_review_enabled: event.target.checked })}
            />
            Review on push / PR
          </label>
          <label className="flex items-center gap-2">
            Block at
            <select
              className="h-8 rounded-lg border border-white/10 bg-slate-950 px-2 text-xs"
              value={project.auto_block_on_severity ?? ""}
              onChange={(event) => policy.mutate({ auto_block_on_severity: event.target.value || null })}
            >
              <option value="">Off (advisory only)</option>
              <option value="critical">critical</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
            </select>
          </label>
        </div>
      )}
      <div className="mt-4 space-y-2">
        {rules?.length === 0 && <p className="text-sm text-slate-400">No rules yet.</p>}
        {rules?.map((rule) => (
          <div key={rule.id} className="rounded-xl bg-white/5 px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{rule.title}</p>
                <p className="mt-1 text-xs text-slate-400">{rule.rule_text}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{rule.stack}</Badge>
                <Badge tone={rule.is_active ? "green" : "slate"}>{rule.is_active ? "active" : "off"}</Badge>
                {can("projects.manage_rules") && (
                  <Button size="sm" variant="ghost" onClick={() => toggle.mutate({ id: rule.id, is_active: !rule.is_active })}>
                    {rule.is_active ? "Disable" : "Enable"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {can("projects.manage_rules") && (
        <form
          className="mt-4 grid gap-2 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (title && ruleText) create.mutate();
          }}
        >
          <Input placeholder="Rule title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <select className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
              {["architecture", "security", "style", "testing", "performance"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm" value={stack} onChange={(event) => setStack(event.target.value)}>
              {["general", "laravel", "nextjs"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="md:col-span-2 min-h-20 rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
            placeholder="What reviewers should enforce"
            value={ruleText}
            onChange={(event) => setRuleText(event.target.value)}
          />
          <Button size="sm" disabled={!title || !ruleText || create.isPending}>
            Add rule
          </Button>
        </form>
      )}
    </Card>
  );
}
