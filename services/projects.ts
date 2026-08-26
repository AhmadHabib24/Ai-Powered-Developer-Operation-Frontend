import api from "@/lib/api";
import type { Paginated, Project, Task } from "@/types";

export async function listProjects(params?: Record<string, string>) {
  const { data } = await api.get<Paginated<Project>>("/api/v1/projects", { params });
  return data;
}

export async function getProject(id: number | string) {
  const { data } = await api.get<{ data: Project }>(`/api/v1/projects/${id}`);
  return data.data;
}

export async function createProject(payload: Partial<Project> & { name: string; member_ids?: number[] }) {
  const { data } = await api.post<{ data: Project }>("/api/v1/projects", payload);
  return data.data;
}

export async function updateProject(id: number | string, payload: Partial<Project>) {
  const { data } = await api.put<{ data: Project }>(`/api/v1/projects/${id}`, payload);
  return data.data;
}

export async function listProjectTasks(projectId: number | string, params?: Record<string, string>) {
  const { data } = await api.get<Paginated<Task>>(`/api/v1/projects/${projectId}/tasks`, { params });
  return data;
}

export async function createTask(projectId: number | string, payload: Partial<Task> & { title: string; assignee_id?: number }) {
  const { data } = await api.post<{ data: Task }>(`/api/v1/projects/${projectId}/tasks`, payload);
  return data.data;
}

export async function getProjectHealth(id: number | string) {
  const { data } = await api.get(`/api/v1/projects/${id}/health`);
  return data.data;
}

export async function addProjectMember(projectId: number | string, userId: number, membership_role = "member") {
  const { data } = await api.post(`/api/v1/projects/${projectId}/members`, { user_id: userId, membership_role });
  return data.data;
}
