import api from "@/lib/api";
import type { Paginated, TimeEntry, TimeSession, TimeSummary } from "@/types";

export async function getCurrentSession() {
  const { data } = await api.get<{
    data: TimeSession | null;
    meta: { work_mode: "office" | "remote"; timer_required: boolean };
  }>("/api/v1/time/sessions/current");
  return { session: data.data, ...data.meta };
}

export async function setWorkMode(work_mode: "office" | "remote") {
  const { data } = await api.post("/api/v1/time/mode", { work_mode });
  return data;
}

export async function startTimer(taskId: number) {
  const { data } = await api.post<{ data: TimeSession }>("/api/v1/time/sessions/start", { task_id: taskId });
  return data.data;
}

export async function pauseTimer(sessionId: number) {
  const { data } = await api.post<{ data: TimeSession }>(`/api/v1/time/sessions/${sessionId}/pause`);
  return data.data;
}

export async function resumeTimer(sessionId: number) {
  const { data } = await api.post<{ data: TimeSession }>(`/api/v1/time/sessions/${sessionId}/resume`);
  return data.data;
}

export async function stopTimer(sessionId: number) {
  const { data } = await api.post<{ data: TimeEntry }>(`/api/v1/time/sessions/${sessionId}/stop`);
  return data.data;
}

export async function listTimeEntries(params?: Record<string, string | number | undefined>) {
  const { data } = await api.get<Paginated<TimeEntry>>("/api/v1/time/entries", { params });
  return data;
}

export async function createManualEntry(payload: {
  task_id: number;
  started_at: string;
  ended_at: string;
  reason: string;
  work_mode?: "office" | "remote";
}) {
  const { data } = await api.post<{ data: TimeEntry }>("/api/v1/time/entries", payload);
  return data.data;
}

export async function adjustTimeEntry(entryId: number, payload: { delta_seconds: number; reason: string }) {
  const { data } = await api.post<{ data: TimeEntry }>(`/api/v1/time/entries/${entryId}/adjust`, payload);
  return data.data;
}

export async function getTimeSummary(params?: Record<string, string | number | undefined>) {
  const { data } = await api.get<{ data: TimeSummary }>("/api/v1/time/summary", { params });
  return data.data;
}
