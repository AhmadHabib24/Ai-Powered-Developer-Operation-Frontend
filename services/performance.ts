import api from "@/lib/api";
import type {
  MonthlySummary,
  Paginated,
  PerformanceAnalytics,
  PerformancePoint,
  PerformanceRule,
  PerformanceSnapshot,
  WeeklyReport,
} from "@/types";

export async function listPerformanceRules() {
  const { data } = await api.get<{ data: PerformanceRule[] }>("/api/v1/performance/rules");
  return data.data;
}

export async function createPerformanceRule(payload: {
  name: string;
  slug: string;
  points: number;
  conditions?: { event?: string };
}) {
  const { data } = await api.post<{ data: PerformanceRule }>("/api/v1/performance/rules", payload);
  return data.data;
}

export async function updatePerformanceRule(id: number, payload: Partial<Pick<PerformanceRule, "name" | "points" | "is_active" | "conditions">>) {
  const { data } = await api.put<{ data: PerformanceRule }>(`/api/v1/performance/rules/${id}`, payload);
  return data.data;
}

export async function listPerformancePoints(params?: { user_id?: number }) {
  const { data } = await api.get<Paginated<PerformancePoint>>("/api/v1/performance/points", { params });
  return data.data;
}

export async function awardPerformancePoints(payload: { user_id: number; rule_id: number; reason: string }) {
  const { data } = await api.post<{ data: PerformancePoint }>("/api/v1/performance/points", payload);
  return data.data;
}

export async function getPerformanceSnapshot(userId: number | string) {
  const { data } = await api.get<{ data: PerformanceSnapshot }>(`/api/v1/performance/users/${userId}`);
  return data.data;
}

export async function getPerformanceAnalytics() {
  const { data } = await api.get<{ data: PerformanceAnalytics }>("/api/v1/performance/analytics");
  return data.data;
}

export async function recalculatePerformance() {
  const { data } = await api.post<{ data: { recalculated: number } }>("/api/v1/performance/recalculate");
  return data.data;
}

export async function listWeeklyReports() {
  const { data } = await api.get<{ data: WeeklyReport[] }>("/api/v1/reports/weekly");
  return data.data;
}

export async function getMonthlySummary() {
  const { data } = await api.get<{ data: MonthlySummary }>("/api/v1/reports/monthly");
  return data.data;
}

export async function generateWeeklyReports() {
  const { data } = await api.post<{ data: { generated: number } }>("/api/v1/reports/weekly/generate");
  return data.data;
}
