"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/api";
import api from "@/lib/api";
import type { RequirementAnalysis } from "@/types";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProjectAnalysesPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["analyses", params.id],
    queryFn: async () => {
      const { data } = await api.get<{ data: RequirementAnalysis[] }>(`/api/v1/projects/${params.id}/analyses`);
      return data.data;
    },
  });

  if (error) return <p className="text-rose-700 dark:text-rose-300">{apiErrorMessage(error, "Unable to load analyses.")}</p>;
  if (isLoading) return <p className="text-muted">Loading drafts…</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/projects/${params.id}`} className="text-sm text-amber-700 dark:text-amber-300">
          Back to project
        </Link>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Requirement drafts</h1>
      </div>
      <Card>
        <CardTitle>Analyses</CardTitle>
        <div className="mt-4 space-y-2">
          {data?.length === 0 && <p className="text-sm text-muted">No analyses yet.</p>}
          {data?.map((analysis) => (
            <Link
              key={analysis.id}
              href={`/projects/${params.id}/analyses/${analysis.id}`}
              className="flex flex-col gap-2 rounded-xl bg-foreground/5 px-4 py-3 hover:bg-foreground/10 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{analysis.summary ?? `Analysis #${analysis.id}`}</p>
                <p className="text-xs text-muted">{analysis.complexity ?? "unscored"}</p>
              </div>
              <Badge>{analysis.status}</Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
