import api from "@/lib/api";
import type { Paginated, Team, User } from "@/types";

export async function listUsers(params?: Record<string, string>) {
  const { data } = await api.get<Paginated<User>>("/api/v1/users", { params });
  return data;
}

export async function listTeams() {
  const { data } = await api.get<Paginated<Team>>("/api/v1/teams");
  return data;
}

export async function createTeam(payload: { name: string; description?: string; lead_id?: number }) {
  const { data } = await api.post<{ data: Team }>("/api/v1/teams", payload);
  return data.data;
}
