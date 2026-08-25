import api from "@/lib/api";
import type {
  GitCommit,
  GitIdentity,
  GitIntegration,
  GitProviderStatus,
  GitPullRequest,
  GitRemoteRepository,
  GitRepository,
  Paginated,
} from "@/types";

export async function getGitProviders() {
  const { data } = await api.get<{ data: GitProviderStatus[] }>("/api/v1/git/providers");
  return data.data;
}

export async function startGithubOAuth(projectId?: number) {
  const { data } = await api.post<{ data: { url: string; state: string } }>("/api/v1/git/github/oauth/redirect", {
    project_id: projectId,
  });
  return data.data;
}

export async function listGitIntegrations() {
  const { data } = await api.get<{ data: GitIntegration[] }>("/api/v1/git/integrations");
  return data.data;
}

export async function listRemoteRepositories(integrationId: number) {
  const { data } = await api.get<{ data: GitRemoteRepository[] }>(`/api/v1/git/integrations/${integrationId}/repositories`);
  return data.data;
}

export async function connectProjectRepository(projectId: number | string, payload: { integration_id: number; external_id: string }) {
  const { data } = await api.post<{ data: GitRepository }>(`/api/v1/projects/${projectId}/repositories`, payload);
  return data.data;
}

export async function listProjectRepositories(projectId: number | string) {
  const { data } = await api.get<{ data: GitRepository[] }>(`/api/v1/projects/${projectId}/repositories`);
  return data.data;
}

export async function listProjectCommits(projectId: number | string) {
  const { data } = await api.get<Paginated<GitCommit>>(`/api/v1/projects/${projectId}/commits`);
  return data;
}

export async function listProjectPullRequests(projectId: number | string) {
  const { data } = await api.get<Paginated<GitPullRequest>>(`/api/v1/projects/${projectId}/pull-requests`);
  return data;
}

export async function listGitIdentities() {
  const { data } = await api.get<{ data: GitIdentity[] }>("/api/v1/git/identities");
  return data.data;
}

export async function saveGitIdentity(login: string, email?: string) {
  const { data } = await api.post<{ data: GitIdentity }>("/api/v1/git/identities", { login, email });
  return data.data;
}
