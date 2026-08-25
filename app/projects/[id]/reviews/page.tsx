"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/api";
import { listCodeReviews } from "@/services/reviews";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProjectReviewsPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["code-reviews", params.id],
    queryFn: () => listCodeReviews(params.id),
  });

  if (error) return <p className="text-rose-300">{apiErrorMessage(error, "Unable to load reviews.")}</p>;
  if (isLoading) return <p className="text-slate-400">Loading reviews…</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/projects/${params.id}`} className="text-sm text-cyan-300">
          Back to project
        </Link>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Code reviews</h1>
        <p className="mt-2 text-sm text-slate-400">AI findings are about the diff. A lead confirms or dismisses them.</p>
      </div>
      <Card>
        <CardTitle>Reviews</CardTitle>
        <div className="mt-4 space-y-2">
          {data?.length === 0 && <p className="text-sm text-slate-400">No reviews yet.</p>}
          {data?.map((review) => (
            <Link
              key={review.id}
              href={`/projects/${params.id}/reviews/${review.id}`}
              className="flex flex-col gap-2 rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{review.summary ?? `Review #${review.id}`}</p>
                <p className="text-xs text-slate-400">
                  {review.trigger} · {review.provider ?? "ai"}
                  {review.commit_sha ? ` · ${review.commit_sha.slice(0, 7)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {review.blocked && <Badge tone="red">blocked</Badge>}
                <Badge>{review.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
