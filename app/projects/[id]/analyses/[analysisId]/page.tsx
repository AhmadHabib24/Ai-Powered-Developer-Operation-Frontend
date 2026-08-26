"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { approveAnalysis, getAnalysis, rejectAnalysis, updateAnalysis } from "@/services/requirements";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AnalysisReviewPage() {
  const params = useParams<{ id: string; analysisId: string }>();
  const router = useRouter();
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["analysis", params.analysisId],
    queryFn: () => getAnalysis(params.analysisId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "processing" ? 2000 : false;
    },
  });
  const [jsonText, setJsonText] = useState("");

  useEffect(() => {
    if (data?.structured_json) {
      setJsonText(JSON.stringify(data.structured_json, null, 2));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => updateAnalysis(params.analysisId, { structured_json: JSON.parse(jsonText) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analysis", params.analysisId] });
      toast.success("Draft updated");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not save the draft.")),
  });

  const approve = useMutation({
    mutationFn: () => approveAnalysis(params.analysisId),
    onSuccess: () => {
      toast.success("Work structure committed to the project");
      router.push(`/projects/${params.id}`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not approve.")),
  });

  const reject = useMutation({
    mutationFn: () => rejectAnalysis(params.analysisId, "Rejected during review"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analysis", params.analysisId] });
      toast.success("Draft rejected");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not reject.")),
  });

  if (error) return <p className="text-rose-300">{apiErrorMessage(error, "Unable to load the analysis.")}</p>;
  if (isLoading || !data) return <p className="text-slate-400">Loading analysis…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/projects/${params.id}`} className="text-sm text-cyan-300">
            Back to project
          </Link>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Review requirement draft</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">{data.summary}</p>
        </div>
        <Badge>{data.status}</Badge>
      </div>
      {(data.status === "queued" || data.status === "processing") && (
        <p className="text-sm text-amber-200">Analysis is still running. This page will refresh when the draft is ready.</p>
      )}
      {data.status === "failed" && (
        <p className="text-sm text-rose-300">{data.error || "Analysis failed. Try a text-based PDF, TXT, or MD file."}</p>
      )}
      <Card>
        <CardTitle>Proposed structure</CardTitle>
        <div className="mt-4 space-y-3 text-sm">
          {data.structured_json?.modules.map((module) => (
            <div key={module.name} className="rounded-xl bg-white/5 p-3">
              <p className="font-medium">{module.name}</p>
              {module.features.map((feature) => (
                <div key={feature.name} className="mt-2 pl-3">
                  <p className="text-cyan-200">{feature.name}</p>
                  {feature.stories.map((story) => (
                    <div key={story.title} className="mt-1 pl-3 text-slate-300">
                      <p>{story.title}</p>
                      <ul className="list-disc pl-5 text-xs text-slate-400">
                        {story.tasks.map((task) => (
                          <li key={task.title}>
                            {task.title} · {task.estimated_hours}h · {task.priority}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
      {data.status === "draft" && can("projects.update") && (
        <Card>
          <CardTitle>Edit draft JSON</CardTitle>
          <textarea
            className="mt-3 min-h-64 w-full rounded-lg border border-white/10 bg-slate-950 p-3 font-mono text-xs"
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={save.isPending} onClick={() => save.mutate()}>
              Save edits
            </Button>
            <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate()}>
              Approve and create work
            </Button>
            <Button size="sm" variant="danger" disabled={reject.isPending} onClick={() => reject.mutate()}>
              Reject
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
