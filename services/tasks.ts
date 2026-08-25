import api from "@/lib/api";
import type { Task } from "@/types";

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

export async function addComment(id: number | string, body: string) {
  const { data } = await api.post(`/api/v1/tasks/${id}/comments`, { body });
  return data.data;
}
