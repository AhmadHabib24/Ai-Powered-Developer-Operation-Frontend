"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { analyzeDocument, listRequirementDocuments, uploadRequirementDocument } from "@/services/requirements";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ProjectRequirementsPanel({ projectId }: { projectId: string }) {
  const { can } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const { data: documents } = useQuery({
    queryKey: ["requirements", projectId],
    queryFn: () => listRequirementDocuments(projectId),
  });

  const runAnalyze = async (documentId: number) => {
    const analysis = await analyzeDocument(documentId);
    queryClient.invalidateQueries({ queryKey: ["requirements", projectId] });
    if (analysis.status === "failed") {
      throw new Error(analysis.error || "Analysis failed.");
    }
    toast.success("Analysis ready for review");
    router.push(`/projects/${projectId}/analyses/${analysis.id}`);
    return analysis;
  };

  const upload = useMutation({
    mutationFn: async () => {
      const document = await uploadRequirementDocument(projectId, file!);
      if (document.extraction_status !== "ready") {
        return document;
      }
      if (can("ai.use")) {
        await runAnalyze(document.id);
      }
      return document;
    },
    onSuccess: (document) => {
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["requirements", projectId] });
      if (document.extraction_status !== "ready") {
        toast.error(document.extraction_error || "Text could not be extracted from this file.");
      } else if (!can("ai.use")) {
        toast.success("Document uploaded and text extracted");
      }
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Upload or analysis failed.")),
  });

  const analyze = useMutation({
    mutationFn: (documentId: number) => runAnalyze(documentId),
    onError: (error) => toast.error(apiErrorMessage(error, "Analysis failed.")),
  });

  return (
    <Card>
      <CardTitle>Requirements</CardTitle>
      <p className="mt-2 text-sm text-slate-400">
        Upload PDF, DOCX, TXT, or MD. NORA drafts modules, features, stories, and tasks. Nothing is created until you approve.
      </p>
      {can("projects.update") && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="text-sm text-slate-300"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <Button size="sm" disabled={!file || upload.isPending} onClick={() => upload.mutate()}>
            {can("ai.use") ? "Upload and analyze" : "Upload"}
          </Button>
        </div>
      )}
      <div className="mt-4 space-y-2">
        {documents?.length === 0 && <p className="text-sm text-slate-400">No requirement documents yet.</p>}
        {documents?.map((document) => (
          <div key={document.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
            <div>
              <p className="font-medium">{document.original_name}</p>
              <p className="text-xs text-slate-400">{document.extension} · {Math.round(document.size_bytes / 1024)} KB</p>
              {document.extraction_error && <p className="mt-1 text-xs text-rose-300">{document.extraction_error}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={document.extraction_status === "ready" ? "green" : document.extraction_status === "failed" ? "red" : "yellow"}>
                {document.extraction_status}
              </Badge>
              {can("ai.use") && document.extraction_status === "ready" && (
                <Button size="sm" disabled={analyze.isPending || upload.isPending} onClick={() => analyze.mutate(document.id)}>
                  Analyze
                </Button>
              )}
              <Link className="text-xs text-amber-300" href={`/projects/${projectId}/analyses`}>
                Drafts
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
