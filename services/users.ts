import api from "@/lib/api";
import type { Paginated, Team, User } from "@/types";

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
  experience_level?: string;
  availability_status?: string;
  weekly_capacity_hours?: number;
  phone?: string | null;
  timezone?: string;
  bio?: string | null;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password" | "password_confirmation">> & {
  password?: string;
  password_confirmation?: string;
  is_active?: boolean;
};

export type TeamPayload = {
  name: string;
  description?: string | null;
  lead_id?: number | null;
  is_active?: boolean;
};

export async function listUsers(params?: Record<string, string>) {
  const { data } = await api.get<Paginated<User>>("/api/v1/users", { params });
  return data;
}

export async function createUser(payload: CreateUserPayload) {
  const { data } = await api.post<{ data: User }>("/api/v1/users", payload);
  return data.data;
}

export async function updateUser(id: number, payload: UpdateUserPayload) {
  const { data } = await api.put<{ data: User }>(`/api/v1/users/${id}`, payload);
  return data.data;
}

export async function deleteUser(id: number) {
  const { data } = await api.delete<{ data: { deleted: boolean } }>(`/api/v1/users/${id}`);
  return data.data;
}

export async function listTeams(params?: Record<string, string>) {
  const { data } = await api.get<Paginated<Team>>("/api/v1/teams", { params });
  return data;
}

export async function createTeam(payload: TeamPayload) {
  const { data } = await api.post<{ data: Team }>("/api/v1/teams", payload);
  return data.data;
}

export async function updateTeam(id: number, payload: Partial<TeamPayload>) {
  const { data } = await api.put<{ data: Team }>(`/api/v1/teams/${id}`, payload);
  return data.data;
}

export async function deleteTeam(id: number) {
  const { data } = await api.delete<{ data: { deleted: boolean } }>(`/api/v1/teams/${id}`);
  return data.data;
}

export async function addTeamMember(teamId: number, payload: { user_id: number; membership_role?: "lead" | "member" }) {
  const { data } = await api.post<{ data: Team }>(`/api/v1/teams/${teamId}/members`, payload);
  return data.data;
}

export async function removeTeamMember(teamId: number, userId: number) {
  const { data } = await api.delete<{ data: Team }>(`/api/v1/teams/${teamId}/members/${userId}`);
  return data.data;
}
