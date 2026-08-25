"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { getCodeReview, resolveFinding } from "@/services/reviews";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

const severityTone: Record<string, string> = {
  critical: "red",
  high: "red",
  medium: "yellow",
  low: "slate",
  suggestion: "cyan",
};

export default function CodeReviewDetailPage() {
  const params = useParams<{ id: string; reviewId: string }>();
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const { data: review, isLoading, error } = useQuery({
    queryKey: ["code-review", params.reviewId],
    queryFn: () => getCodeReview(params.reviewId),
  });

  const resolve = useMutation({
    mutationFn: ({ findingId, resolution }: { findingId: number; resolution: "confirmed" | "dismissed" }) =>
      resolveFinding(findingId, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["code-review", params.reviewId] });
      toast.success("Finding updated");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not update the finding.")),
  });

  if (error) return <p className="text-rose-300">{apiErrorMessage(error, "Unable to load this review.")}</p>;
  if (isLoading || !review) return <p className="text-slate-400">Loading review…</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/projects/${params.id}/reviews`} className="text-sm text-cyan-300">
          Back to reviews
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold sm:text-3xl">Review #{review.id}</h1>
          <Badge>{review.status}</Badge>
          {review.blocked && <Badge tone="red">merge gate</Badge>}
        </div>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">{review.summary}</p>
        <p className="mt-1 text-xs text-slate-500">
          {review.trigger}
          {review.commit_sha ? ` · ${review.commit_sha.slice(0, 10)}` : ""}
          {review.pull_request ? ` · PR #${review.pull_request.number}` : ""}
          {review.provider ? ` · ${review.provider}` : ""}
        </p>
        {review.error && <p className="mt-2 text-sm text-rose-300">{review.error}</p>}
      </div>
      <Card>
        <CardTitle>Findings</CardTitle>
        <div className="mt-4 space-y-3">
          {review.findings?.length === 0 && (
            <p className="text-sm text-slate-400">No issues were recorded on this diff.</p>
          )}
          {review.findings?.map((finding) => (
            <div key={finding.id} className="rounded-xl bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={severityTone[finding.severity] ?? "slate"}>{finding.severity}</Badge>
                  <Badge>{finding.category}</Badge>
                  <Badge tone={finding.resolution === "open" ? "yellow" : "green"}>{finding.resolution}</Badge>
                </div>
                {can("code_review.manage") && finding.resolution === "open" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate({ findingId: finding.id, resolution: "confirmed" })}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate({ findingId: finding.id, resolution: "dismissed" })}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
              <p className="mt-2 font-medium">{finding.issue}</p>
              <p className="mt-1 text-xs text-slate-400">
                {finding.file_path}
                {finding.line_start ? `:${finding.line_start}` : ""}
              </p>
              {finding.why_it_matters && <p className="mt-2 text-sm text-slate-300">{finding.why_it_matters}</p>}
              {finding.recommendation && (
                <p className="mt-1 text-sm text-cyan-100/90">Fix: {finding.recommendation}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
