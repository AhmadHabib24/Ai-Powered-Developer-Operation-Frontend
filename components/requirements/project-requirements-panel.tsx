"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { analyzeDocument, listRequirementDocuments, uploadRequirementDocument } from "@/services/requirements";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export function ProjectRequirementsPanel({ projectId }: { projectId: string }) {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const { data: documents } = useQuery({
    queryKey: ["requirements", projectId],
    queryFn: () => listRequirementDocuments(projectId),
  });

  const upload = useMutation({
    mutationFn: () => uploadRequirementDocument(projectId, file!),
    onSuccess: () => {
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["requirements", projectId] });
      toast.success("Document uploaded and text extracted");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Upload failed.")),
  });

  const analyze = useMutation({
    mutationFn: (documentId: number) => analyzeDocument(documentId),
    onSuccess: (analysis) => {
      queryClient.invalidateQueries({ queryKey: ["requirements", projectId] });
      toast.success("Analysis ready for review");
      window.location.href = `/projects/${projectId}/analyses/${analysis.id}`;
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Analysis failed.")),
  });

  return (
    <Card>
      <CardTitle>Requirements</CardTitle>
      <p className="mt-2 text-sm text-slate-400">
        Upload PDF, DOCX, TXT, or MD. NOVA drafts modules, features, stories, and tasks. Nothing is created until you approve.
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
            Upload
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
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={document.extraction_status === "ready" ? "green" : "yellow"}>{document.extraction_status}</Badge>
              {can("ai.use") && document.extraction_status === "ready" && (
                <Button size="sm" disabled={analyze.isPending} onClick={() => analyze.mutate(document.id)}>
                  Analyze
                </Button>
              )}
              <Link className="text-xs text-cyan-300" href={`/projects/${projectId}/analyses`}>
                Drafts
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
