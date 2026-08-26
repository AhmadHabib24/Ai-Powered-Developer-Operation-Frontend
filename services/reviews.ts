import api from "@/lib/api";
import type { CodeReview, CodeReviewFinding, ProjectRule } from "@/types";

export async function listProjectRules(projectId: number | string) {
  const { data } = await api.get<{ data: ProjectRule[] }>(`/api/v1/projects/${projectId}/rules`);
  return data.data;
}

export async function createProjectRule(
  projectId: number | string,
  payload: Pick<ProjectRule, "category" | "title" | "rule_text"> & { stack?: string },
) {
  const { data } = await api.post<{ data: ProjectRule }>(`/api/v1/projects/${projectId}/rules`, payload);
  return data.data;
}

export async function updateProjectRule(
  projectId: number | string,
  ruleId: number,
  payload: Partial<Pick<ProjectRule, "title" | "rule_text" | "category" | "stack" | "is_active">>,
) {
  const { data } = await api.put<{ data: ProjectRule }>(`/api/v1/projects/${projectId}/rules/${ruleId}`, payload);
  return data.data;
}

export async function deleteProjectRule(projectId: number | string, ruleId: number) {
  await api.delete(`/api/v1/projects/${projectId}/rules/${ruleId}`);
}

export async function listCodeReviews(projectId: number | string) {
  const { data } = await api.get<{ data: CodeReview[] }>(`/api/v1/projects/${projectId}/code-reviews`);
  return data.data;
}

export async function requestCodeReview(projectId: number | string, payload: { pull_request_id?: number; commit_sha?: string }) {
  const { data } = await api.post<{ data: CodeReview }>(`/api/v1/projects/${projectId}/code-reviews`, payload);
  return data.data;
}

export async function getCodeReview(id: number | string) {
  const { data } = await api.get<{ data: CodeReview }>(`/api/v1/code-reviews/${id}`);
  return data.data;
}

export async function resolveFinding(findingId: number, resolution: "confirmed" | "dismissed") {
  const { data } = await api.post<{ data: CodeReviewFinding }>(`/api/v1/code-review-findings/${findingId}/resolve`, {
    resolution,
  });
  return data.data;
}

export async function shareCodeReview(id: number | string, payload: { user_ids: number[]; note?: string }) {
  const { data } = await api.post<{ data: { shared_with: Array<{ id: number; name: string; email: string }> } }>(
    `/api/v1/code-reviews/${id}/share`,
    payload,
  );
  return data.data;
}
