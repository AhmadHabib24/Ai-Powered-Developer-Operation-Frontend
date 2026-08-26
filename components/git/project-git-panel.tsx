"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { connectProjectRepository, getGitProviders, listGitIntegrations, listProjectCommits, listProjectPullRequests, listProjectRepositories, listRemoteRepositories, startGithubOAuth } from "@/services/git";
import { requestCodeReview } from "@/services/reviews";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ProjectGitPanel({ projectId }: { projectId: string }) {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [integrationId, setIntegrationId] = useState<number | "">("");
  const [externalId, setExternalId] = useState("");

  const { data: providers } = useQuery({ queryKey: ["git", "providers"], queryFn: getGitProviders, enabled: can("git.view") });
  const { data: integrations } = useQuery({ queryKey: ["git", "integrations"], queryFn: listGitIntegrations, enabled: can("git.connect") });
  const { data: remotes } = useQuery({
    queryKey: ["git", "remotes", integrationId],
    queryFn: () => listRemoteRepositories(Number(integrationId)),
    enabled: can("git.connect") && Boolean(integrationId),
  });
  const { data: repos } = useQuery({
    queryKey: ["git", "project-repos", projectId],
    queryFn: () => listProjectRepositories(projectId),
    enabled: can("git.view"),
  });
  const { data: commits } = useQuery({
    queryKey: ["git", "commits", projectId],
    queryFn: () => listProjectCommits(projectId),
    enabled: can("git.view"),
  });
  const { data: pullRequests } = useQuery({
    queryKey: ["git", "pull-requests", projectId],
    queryFn: () => listProjectPullRequests(projectId),
    enabled: can("git.view"),
  });

  useEffect(() => {
    if (searchParams.get("git") === "connected") {
      toast.success("GitHub connected. Choose a repository to link.");
      queryClient.invalidateQueries({ queryKey: ["git"] });
    }
  }, [searchParams, queryClient]);

  const connectOauth = useMutation({
    mutationFn: () => startGithubOAuth(Number(projectId)),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => toast.error(apiErrorMessage(error, "GitHub OAuth is not configured.")),
  });

  const connectRepo = useMutation({
    mutationFn: () =>
      connectProjectRepository(projectId, {
        integration_id: Number(integrationId),
        external_id: externalId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["git"] });
      toast.success("Repository linked. Webhooks will store commits and pull requests.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not link the repository.")),
  });

  const reviewPr = useMutation({
    mutationFn: (pull_request_id: number) => requestCodeReview(projectId, { pull_request_id }),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: ["code-reviews", projectId] });
      toast.success("Review queued");
      window.location.href = `/projects/${projectId}/reviews/${review.id}`;
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not start a review.")),
  });

  if (!can("git.view")) return null;

  const github = providers?.find((provider) => provider.name === "github");

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>GitHub</CardTitle>
        {github?.organization && (
          <p className="mt-2 text-sm text-slate-400">
            Company org{" "}
            <a className="text-cyan-300 hover:text-cyan-200" href={github.organization_url ?? `https://github.com/${github.organization}`} target="_blank" rel="noreferrer">
              {github.organization}
            </a>
            . Developers push there. NOVA records commits and PRs after a repo is linked.{" "}
            {can("git.view") && (
              <Link className="text-cyan-300 hover:text-cyan-200" href="/git">
                Open all {github.organization} repositories
              </Link>
            )}
          </p>
        )}
        {!github?.configured && (
          <p className="mt-2 text-sm text-amber-200">
            GitHub OAuth is not configured yet. A CTO with Settings access must create an OAuth App on{" "}
            <a
              className="underline"
              href={
                github?.organization
                  ? `https://github.com/organizations/${github.organization}/settings/applications`
                  : "https://github.com/settings/developers"
              }
              target="_blank"
              rel="noreferrer"
            >
              {github?.organization ?? "GitHub"}
            </a>{" "}
            and paste the client ID and secret into Settings → GitHub. Callback URL:{" "}
            <code className="text-amber-100">/api/v1/git/github/oauth/callback</code>
          </p>
        )}
        {repos && repos.length > 0 && (
          <div className="mt-3 space-y-2">
            {repos.map((repo) => (
              <div key={repo.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
                <a href={repo.html_url ?? "#"} className="hover:text-cyan-200" target="_blank" rel="noreferrer">
                  {repo.full_name}
                </a>
                <Badge tone={repo.webhook_status === "active" ? "green" : "yellow"}>{repo.webhook_status ?? "pending"}</Badge>
              </div>
            ))}
          </div>
        )}
        {can("git.connect") && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={!github?.configured || connectOauth.isPending} onClick={() => connectOauth.mutate()}>
                Connect {github?.organization ?? "GitHub"}
              </Button>
              {github?.install_url && github.app_configured && (
                <Button size="sm" variant="secondary" asChild>
                  <a href={github.install_url} target="_blank" rel="noreferrer">
                    Install GitHub App on {github.organization ?? "GitHub"}
                  </a>
                </Button>
              )}
            </div>
            {Boolean(integrationId) && remotes && remotes.length === 0 && (
              <p className="text-sm text-amber-200">
                No {github?.organization ?? "company"} repositories are visible to this GitHub account. Invite the connecting user to the org as a member, then reconnect.
              </p>
            )}
            {integrations && integrations.length > 0 && (
              <div className="grid gap-2 md:grid-cols-2">
                <select
                  className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm"
                  value={integrationId}
                  onChange={(event) => {
                    setIntegrationId(event.target.value ? Number(event.target.value) : "");
                    setExternalId("");
                  }}
                >
                  <option value="">Integration</option>
                  {integrations.map((integration) => (
                    <option key={integration.id} value={integration.id}>
                      {integration.organization_name ?? `GitHub #${integration.id}`}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm"
                  value={externalId}
                  onChange={(event) => setExternalId(event.target.value)}
                  disabled={!remotes}
                >
                  <option value="">Repository</option>
                  {remotes?.map((repo) => (
                    <option key={repo.external_id} value={repo.external_id}>
                      {repo.full_name}
                    </option>
                  ))}
                </select>
                <Button size="sm" disabled={!integrationId || !externalId || connectRepo.isPending} onClick={() => connectRepo.mutate()}>
                  Link repository
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>Commits</CardTitle>
          <div className="mt-3 space-y-2 text-sm">
            {commits?.data.length === 0 && <p className="text-slate-400">No webhook commits yet.</p>}
            {commits?.data.map((commit) => (
              <div key={commit.id} className="rounded-xl bg-white/5 px-3 py-2">
                <p className="font-medium">{commit.message}</p>
                <p className="text-xs text-slate-400">
                  {commit.sha.slice(0, 7)} · {commit.author_name ?? commit.user?.name ?? "unknown"}
                  {commit.task ? ` · ${commit.task.title}` : ""}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Pull requests</CardTitle>
          <div className="mt-3 space-y-2 text-sm">
            {pullRequests?.data.length === 0 && <p className="text-slate-400">No pull requests yet.</p>}
            {pullRequests?.data.map((pr) => (
              <div key={pr.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
                <div>
                  <p className="font-medium">
                    #{pr.number} {pr.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {pr.author_login}
                    {pr.task ? ` · ${pr.task.title}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{pr.status}</Badge>
                  {can("code_review.manage") && (
                    <Button size="sm" variant="secondary" disabled={reviewPr.isPending} onClick={() => reviewPr.mutate(pr.id)}>
                      Review
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
