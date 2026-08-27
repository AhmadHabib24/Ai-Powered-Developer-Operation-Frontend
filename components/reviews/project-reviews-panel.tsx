"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";
import { listCodeReviews } from "@/services/reviews";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

function severityTone(status: string, blocked?: boolean) {
  if (blocked) return "red";
  if (status === "failed") return "red";
  if (status === "completed") return "green";
  if (status === "processing" || status === "queued") return "yellow";
  return "slate";
}

export function ProjectReviewsPanel({ projectId }: { projectId: string }) {
  const { can } = useAuth();
  const { data: reviews } = useQuery({
    queryKey: ["code-reviews", projectId],
    queryFn: () => listCodeReviews(projectId),
    enabled: can("code_review.view"),
  });

  if (!can("code_review.view")) return null;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <CardTitle>AI code reviews</CardTitle>
        <Link className="text-xs text-amber-700 dark:text-amber-300" href={`/projects/${projectId}/reviews`}>
          All reviews
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">
        Pushes and pull requests are reviewed against project rules. NEXORA does not block merges unless a severity gate is on.
      </p>
      <div className="mt-4 space-y-2">
        {reviews?.length === 0 && <p className="text-sm text-muted">No reviews yet. Push to a linked repository or request one.</p>}
        {reviews?.slice(0, 5).map((review) => (
          <Link
            key={review.id}
            href={`/projects/${projectId}/reviews/${review.id}`}
            className="flex items-center justify-between rounded-xl bg-foreground/5 px-3 py-2 text-sm hover:bg-foreground/10"
          >
            <div>
              <p className="font-medium">{review.summary ?? `Review #${review.id}`}</p>
              <p className="text-xs text-muted">
                {review.trigger}
                {review.commit_sha ? ` · ${review.commit_sha.slice(0, 7)}` : ""}
                {review.pull_request ? ` · #${review.pull_request.number}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {review.blocked && <Badge tone="red">blocked</Badge>}
              <Badge tone={severityTone(review.status, review.blocked)}>{review.status}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
