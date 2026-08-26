import api from "@/lib/api";
import type { AssignmentRecommendation, RequirementAnalysis, RequirementDocument } from "@/types";

export async function listRequirementDocuments(projectId: number | string) {
  const { data } = await api.get<{ data: RequirementDocument[] }>(`/api/v1/projects/${projectId}/documents`);
  return data.data;
}

export async function uploadRequirementDocument(projectId: number | string, file: File) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<{ data: RequirementDocument }>(`/api/v1/projects/${projectId}/documents`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function analyzeDocument(documentId: number) {
  const { data } = await api.post<{ data: RequirementAnalysis }>(`/api/v1/documents/${documentId}/analyze`, undefined, {
    timeout: 120_000,
  });
  return data.data;
}

export async function getAnalysis(id: number | string) {
  const { data } = await api.get<{ data: RequirementAnalysis }>(`/api/v1/analyses/${id}`);
  return data.data;
}

export async function updateAnalysis(id: number | string, payload: { structured_json: RequirementAnalysis["structured_json"]; summary?: string }) {
  const { data } = await api.put<{ data: RequirementAnalysis }>(`/api/v1/analyses/${id}`, payload);
  return data.data;
}

export async function approveAnalysis(id: number | string) {
  const { data } = await api.post<{ data: RequirementAnalysis }>(`/api/v1/analyses/${id}/approve`);
  return data.data;
}

export async function rejectAnalysis(id: number | string, reason?: string) {
  const { data } = await api.post<{ data: RequirementAnalysis }>(`/api/v1/analyses/${id}/reject`, { reason });
  return data.data;
}

export async function recommendAssignee(taskId: number | string, apply = false) {
  const { data } = await api.post<{ data: AssignmentRecommendation }>(`/api/v1/tasks/${taskId}/recommend-assignee`, { apply });
  return data.data;
}
