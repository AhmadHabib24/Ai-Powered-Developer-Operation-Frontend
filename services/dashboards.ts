import api from "@/lib/api";
import type { CtoDashboard, DeveloperDashboard } from "@/types";

export async function getCtoDashboard() {
  const { data } = await api.get<{ data: CtoDashboard }>("/api/v1/dashboards/cto");
  return data.data;
}

export async function getDeveloperDashboard() {
  const { data } = await api.get<{ data: DeveloperDashboard }>("/api/v1/dashboards/developer");
  return data.data;
}

export async function getProjectDashboard(id: number | string) {
  const { data } = await api.get(`/api/v1/dashboards/projects/${id}`);
  return data.data;
}
