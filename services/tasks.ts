import api from "@/lib/api";
import type { Paginated, Task, TimeExtensionRequest } from "@/types";

export async function listTasks(params?: Record<string, string | number | undefined>) {
  const { data } = await api.get<Paginated<Task>>("/api/v1/tasks", { params });
  return data;
}

export async function getPendingAssignments() {
  const { data } = await api.get<{ data: Task[] }>("/api/v1/tasks/pending-assignments");
  return data.data;
}

export async function getTask(id: number | string) {
  const { data } = await api.get<{ data: Task }>(`/api/v1/tasks/${id}`);
  return data.data;
}

export async function updateTask(id: number | string, payload: Partial<Task>) {
  const { data } = await api.put<{ data: Task }>(`/api/v1/tasks/${id}`, payload);
  return data.data;
}

export async function changeTaskStatus(id: number | string, status: string) {
  const { data } = await api.post<{ data: Task }>(`/api/v1/tasks/${id}/status`, { status });
  return data.data;
}

export async function assignTask(id: number | string, userId: number) {
  const { data } = await api.post<{ data: Task }>(`/api/v1/tasks/${id}/assign`, { user_id: userId });
  return data.data;
}

export async function acceptTask(id: number | string) {
  const { data } = await api.post<{ data: Task }>(`/api/v1/tasks/${id}/accept`);
  return data.data;
}

export async function declineTask(id: number | string, note?: string) {
  const { data } = await api.post<{ data: Task }>(`/api/v1/tasks/${id}/decline`, { note });
  return data.data;
}

export async function addComment(id: number | string, body: string) {
  const { data } = await api.post(`/api/v1/tasks/${id}/comments`, { body });
  return data.data;
}

export async function addTaskAttachment(id: number | string, file: File) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<{ data: Task }>(`/api/v1/tasks/${id}/attachments`, body);
  return data.data;
}

export async function requestTimeExtension(id: number | string, payload: { minutes: number; reason: string }) {
  const { data } = await api.post(`/api/v1/tasks/${id}/time-extensions`, payload);
  return data.data;
}

export async function listTimeExtensions(params?: Record<string, string | number | undefined>) {
  const { data } = await api.get<Paginated<TimeExtensionRequest>>("/api/v1/time-extensions", { params });
  return data;
}

export async function acceptTimeExtension(id: number, note?: string) {
  const { data } = await api.post(`/api/v1/time-extensions/${id}/accept`, { note });
  return data.data;
}

export async function rejectTimeExtension(id: number, note?: string) {
  const { data } = await api.post(`/api/v1/time-extensions/${id}/reject`, { note });
  return data.data;
}
