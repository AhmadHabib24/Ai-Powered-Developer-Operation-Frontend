"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import {
  getGitOrganization,
  listOrganizationBranches,
  listOrganizationPullRequests,
  requestOrganizationReview,
  startGithubOAuth,
} from "@/services/git";
import { listProjects } from "@/services/projects";
import type { GitOrgRepository, GitRemoteBranch, GitRemotePullRequest } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function GitWorkspace() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<number | "">("");
  const [branch, setBranch] = useState("");

  const catalog = useQuery({
    queryKey: ["git", "organization"],
    queryFn: getGitOrganization,
    enabled: can("git.view"),
  });
  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects(),
    enabled: can("git.connect") && can("projects.view"),
  });
  const pullRequests = useQuery({
    queryKey: ["git", "organization", "pulls", openId],
    queryFn: () => listOrganizationPullRequests(openId!),
    enabled: Boolean(openId) && can("git.view"),
  });
  const branches = useQuery({
    queryKey: ["git", "organization", "branches", openId],
    queryFn: () => listOrganizationBranches(openId!),
    enabled: Boolean(openId) && can("git.view"),
  });

  useEffect(() => {
    if (searchParams.get("git") === "connected") {
      toast.success("GitHub connected. Organization repositories are loading.");
      queryClient.invalidateQueries({ queryKey: ["git"] });
    }
  }, [searchParams, queryClient]);

  useEffect(() => {
    if (!openId || !branches.data?.length || branch) return;
    const selected = branches.data.find((item) => item.default)?.name ?? branches.data[0]?.name ?? "";
    setBranch(selected);
  }, [openId, branches.data, branch]);

  const connectOauth = useMutation({
    mutationFn: () => startGithubOAuth(),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => toast.error(apiErrorMessage(error, "GitHub OAuth is not configured.")),
  });

  const review = useMutation({
    mutationFn: (payload: { externalId: string; pull_request_number?: number; project_id?: number; branch?: string }) =>
      requestOrganizationReview(payload.externalId, {
        pull_request_number: payload.pull_request_number,
        project_id: payload.project_id,
        branch: payload.branch,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["git"] });
      toast.success("Code review queued.");
      window.location.href = `/projects/${data.project_id}/reviews/${data.id}`;
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not start a code review.")),
  });

  if (!can("git.view")) {
    return <p className="text-rose-700 dark:text-rose-300">You do not have permission to view Git repositories.</p>;
  }
  if (catalog.error) return <p className="text-rose-700 dark:text-rose-300">{apiErrorMessage(catalog.error, "Unable to load GitHub.")}</p>;
  if (catalog.isLoading || !catalog.data) return <p className="text-muted">Loading GitHub organization…</p>;

  const data = catalog.data;
  const org = data.organization;
  const orgLabel = org ?? "GitHub";

  function startReview(repo: GitOrgRepository, pullRequestNumber?: number) {
    const needsProject = !repo.linked;
    if (needsProject && !projectId) {
      toast.error("Pick a NEXORA project to link this repository, then run code review.");
      setOpenId(repo.external_id);
      return;
    }
    if (!pullRequestNumber && !branch) {
      toast.error("Pick the branch you want reviewed.");
      return;
    }
    review.mutate({
      externalId: repo.external_id,
      pull_request_number: pullRequestNumber,
      project_id: needsProject ? Number(projectId) : undefined,
      branch: pullRequestNumber ? undefined : branch,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">GitHub</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{orgLabel}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Repositories come from Settings → GitHub ({org ? "live organization value" : "set the organization slug first"}
            ). Connect an account or paste a PAT to see private repos, then run a code review on any repository.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can("settings.manage") && (
            <Button variant="secondary" asChild>
              <Link href="/settings">GitHub settings</Link>
            </Button>
          )}
          {can("git.connect") && (
            <Button disabled={!data.oauth_configured || connectOauth.isPending} onClick={() => connectOauth.mutate()}>
              {data.connected ? `Reconnect ${orgLabel}` : `Connect ${orgLabel}`}
            </Button>
          )}
        </div>
      </div>

      {!org && (
        <Card className="border-amber-400/30">
          <CardTitle>Organization not set</CardTitle>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            Open Settings → GitHub and set <code>GITHUB_ORGANIZATION</code> (for example TecVeq-Solutions). The Git page reads that value dynamically.
          </p>
        </Card>
      )}

      {org && !data.oauth_configured && !data.token_configured && (
        <Card className="border-amber-400/30">
          <CardTitle>Credentials needed for private repos</CardTitle>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            Public repositories can still appear. For private {orgLabel} repos, paste a GitHub PAT in Settings → GitHub or click Connect after saving the OAuth client ID and secret.
          </p>
        </Card>
      )}

      {data.list_error && <p className="text-sm text-rose-700 dark:text-rose-300">{data.list_error}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardTitle>Repositories</CardTitle>
          <p className="mt-2 text-3xl font-semibold text-foreground">{data.repository_count}</p>
          <p className="mt-1 text-xs text-muted">Visible in {orgLabel}</p>
        </Card>
        <Card>
          <CardTitle>Linked to NEXORA</CardTitle>
          <p className="mt-2 text-3xl font-semibold text-foreground">{data.repositories.filter((repo) => repo.linked).length}</p>
          <p className="mt-1 text-xs text-muted">Ready for webhooks and history</p>
        </Card>
        <Card>
          <CardTitle>Connection</CardTitle>
          <p className="mt-2 text-sm text-muted">
            {data.connected ? "GitHub account connected" : data.token_configured ? "Using Settings PAT" : "Not connected"}
          </p>
          {org && (
            <a className="mt-2 inline-block text-sm text-amber-700 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-800 dark:text-amber-200" href={data.organization_url ?? "#"} target="_blank" rel="noreferrer">
              github.com/{org}
            </a>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle>Repositories</CardTitle>
        <div className="mt-4 space-y-2">
          {data.repositories.length === 0 && (
            <p className="text-sm text-muted">
              No repositories returned for {orgLabel}. Invite the connecting GitHub user to the org, or add a PAT with repo and read:org in Settings.
            </p>
          )}
          {data.repositories.map((repo) => (
            <RepoRow
              key={repo.external_id}
              repo={repo}
              open={openId === repo.external_id}
              onToggle={() => {
                const next = openId === repo.external_id ? null : repo.external_id;
                setOpenId(next);
                setBranch("");
                if (!repo.linked) setProjectId("");
              }}
              projectId={projectId}
              onProjectId={setProjectId}
              projects={projects.data?.data ?? []}
              pullRequests={openId === repo.external_id ? (pullRequests.data ?? []) : []}
              branches={openId === repo.external_id ? (branches.data ?? []) : []}
              detailsLoading={openId === repo.external_id && (pullRequests.isLoading || branches.isLoading)}
              branch={branch}
              onBranch={setBranch}
              canConnect={can("git.connect")}
              canReview={can("code_review.manage")}
              reviewing={review.isPending}
              onReview={(number) => startReview(repo, number)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function RepoRow({
  repo,
  open,
  onToggle,
  projectId,
  onProjectId,
  projects,
  pullRequests,
  branches,
  detailsLoading,
  branch,
  onBranch,
  canConnect,
  canReview,
  reviewing,
  onReview,
}: {
  repo: GitOrgRepository;
  open: boolean;
  onToggle: () => void;
  projectId: number | "";
  onProjectId: (value: number | "") => void;
  projects: Array<{ id: number; name: string }>;
  pullRequests: GitRemotePullRequest[];
  branches: GitRemoteBranch[];
  detailsLoading: boolean;
  branch: string;
  onBranch: (value: string) => void;
  canConnect: boolean;
  canReview: boolean;
  reviewing: boolean;
  onReview: (pullRequestNumber?: number) => void;
}) {
  const blocked = reviewing || (!repo.linked && !projectId);

  return (
    <div className="rounded-xl bg-foreground/5">
      <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <a href={repo.html_url ?? "#"} className="font-medium hover:text-amber-700 dark:hover:text-amber-800 dark:text-amber-200" target="_blank" rel="noreferrer">
              {repo.full_name}
            </a>
            <Badge tone={repo.private ? "yellow" : "green"}>{repo.private ? "private" : "public"}</Badge>
            {repo.language && <Badge>{repo.language}</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted">
            {repo.linked_project ? (
              <>
                Linked to{" "}
                <Link className="text-amber-700 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-800 dark:text-amber-200" href={`/projects/${repo.linked_project.id}`}>
                  {repo.linked_project.name}
                </Link>
                {repo.reviews_count ? ` · ${repo.reviews_count} review(s)` : ""}
                {repo.open_pull_requests ? ` · ${repo.open_pull_requests} stored open PR(s)` : ""}
              </>
            ) : (
              "Not linked to a NEXORA project yet"
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {repo.linked && repo.linked_project && (
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/projects/${repo.linked_project.id}/reviews`}>Reviews</Link>
            </Button>
          )}
          {canReview && (
            <Button size="sm" variant={open ? "secondary" : "default"} onClick={onToggle}>
              Code review
            </Button>
          )}
        </div>
      </div>
      {open && canReview && (
        <div className="space-y-3 border-t border-border px-3 py-3">
          {!repo.linked && (
            <div className="space-y-2">
              <p className="text-xs text-muted">Link this repository to a NEXORA project so findings have a home.</p>
              {canConnect ? (
                <select
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  value={projectId}
                  onChange={(event) => onProjectId(event.target.value ? Number(event.target.value) : "")}
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-amber-800 dark:text-amber-200">Ask a lead with git.connect to link this repo first.</p>
              )}
            </div>
          )}
          {detailsLoading && <p className="text-sm text-muted">Loading branches and pull requests…</p>}
          {!detailsLoading && (
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-muted">Branch to review</label>
              {branches.length === 0 ? (
                <p className="text-sm text-muted">No branches were returned for this repository.</p>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
                    value={branch}
                    onChange={(event) => onBranch(event.target.value)}
                  >
                    {branches.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                        {item.default ? " (default)" : ""}
                        {item.protected ? " · protected" : ""}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" disabled={blocked || !branch} onClick={() => onReview()}>
                    {reviewing ? "Queueing…" : `Review ${branch || "branch"}`}
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted">{branches.length} branch{branches.length === 1 ? "" : "es"} on GitHub.</p>
            </div>
          )}
          {!detailsLoading && pullRequests.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted">Open pull requests</p>
              {pullRequests.map((pr) => (
                <div key={pr.number} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/20 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">
                      #{pr.number} {pr.title}
                    </p>
                    <p className="text-xs text-muted">
                      {pr.author_login}
                      {pr.head_branch ? ` · ${pr.head_branch}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" disabled={blocked} onClick={() => onReview(pr.number)}>
                    Review PR
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
