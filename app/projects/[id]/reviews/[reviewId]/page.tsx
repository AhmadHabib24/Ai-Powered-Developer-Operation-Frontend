"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { getProject } from "@/services/projects";
import { getCodeReview, resolveFinding, shareCodeReview } from "@/services/reviews";
import { listUsers } from "@/services/users";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
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
  const { can, user } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<number[]>([]);
  const [note, setNote] = useState("");

  const { data: review, isLoading, error } = useQuery({
    queryKey: ["code-review", params.reviewId],
    queryFn: () => getCodeReview(params.reviewId),
  });
  const project = useQuery({
    queryKey: ["project", params.id],
    queryFn: () => getProject(params.id),
  });
  const directory = useQuery({
    queryKey: ["users"],
    queryFn: () => listUsers(),
    enabled: can("users.view"),
  });

  const people = useMemo(() => {
    const rows = [...(directory.data?.data ?? []), ...(project.data?.members ?? [])];
    if (project.data?.owner) rows.push(project.data.owner);
    return [...new Map(rows.filter((person) => person.id !== user?.id).map((person) => [person.id, person])).values()];
  }, [directory.data, project.data, user?.id]);

  const resolve = useMutation({
    mutationFn: ({ findingId, resolution }: { findingId: number; resolution: "confirmed" | "dismissed" }) =>
      resolveFinding(findingId, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["code-review", params.reviewId] });
      toast.success("Finding updated");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not update the finding.")),
  });

  const share = useMutation({
    mutationFn: () => shareCodeReview(params.reviewId, { user_ids: selected, note: note || undefined }),
    onSuccess: (data) => {
      setSelected([]);
      setNote("");
      toast.success(`Shared with ${data.shared_with.map((person) => person.name).join(", ")}.`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not share this review.")),
  });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Review link copied.");
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  if (error) return <p className="text-rose-700 dark:text-rose-300">{apiErrorMessage(error, "Unable to load this review.")}</p>;
  if (isLoading || !review) return <p className="text-muted">Loading review…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/projects/${params.id}/reviews`} className="text-sm text-amber-700 dark:text-amber-300">
            Back to reviews
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold sm:text-3xl">Review #{review.id}</h1>
            <Badge>{review.status}</Badge>
            {review.blocked && <Badge tone="red">merge gate</Badge>}
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted">{review.summary}</p>
          <p className="mt-1 text-xs text-muted">
            {review.trigger}
            {review.branch ? ` · ${review.branch}` : ""}
            {review.commit_sha ? ` · ${review.commit_sha.slice(0, 10)}` : ""}
            {review.pull_request ? ` · PR #${review.pull_request.number}` : ""}
            {review.provider ? ` · ${review.provider}` : ""}
          </p>
          {review.error && <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{review.error}</p>}
        </div>
        <Button size="sm" variant="secondary" onClick={copyLink}>
          Copy link
        </Button>
      </div>
      <Card>
        <CardTitle>Share</CardTitle>
        <p className="mt-2 text-sm text-muted">Send this review to teammates. They get an in-app notification and email with the link.</p>
        {people.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Add people to this project first, then you can share the review.</p>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {people.map((person) => (
                <label key={person.id} className="flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-amber-400"
                    checked={selected.includes(person.id)}
                    onChange={(event) => {
                      setSelected((current) =>
                        event.target.checked ? [...current, person.id] : current.filter((id) => id !== person.id),
                      );
                    }}
                  />
                  <span>
                    {person.name}
                    <span className="block text-xs text-muted">{person.email}</span>
                  </span>
                </label>
              ))}
            </div>
            <Input
              placeholder="Optional note, for example: please check auth on develop"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <Button size="sm" disabled={selected.length === 0 || share.isPending} onClick={() => share.mutate()}>
              {share.isPending ? "Sharing…" : "Share review"}
            </Button>
          </div>
        )}
      </Card>
      <Card>
        <CardTitle>Findings</CardTitle>
        <div className="mt-4 space-y-3">
          {review.findings?.length === 0 && (
            <p className="text-sm text-muted">No issues were recorded on this diff.</p>
          )}
          {review.findings?.map((finding) => (
            <div key={finding.id} className="rounded-xl bg-foreground/5 p-4">
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
              <p className="mt-1 text-xs text-muted">
                {finding.file_path}
                {finding.line_start ? `:${finding.line_start}` : ""}
              </p>
              {finding.why_it_matters && <p className="mt-2 text-sm text-muted">{finding.why_it_matters}</p>}
              {finding.recommendation && (
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-100/90">Fix: {finding.recommendation}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
