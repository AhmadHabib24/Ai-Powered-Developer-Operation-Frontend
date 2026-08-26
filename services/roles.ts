import api from "@/lib/api";
import type { AccessRole, CatalogPermission } from "@/types";

export async function listRoles() {
  const { data } = await api.get<{ data: AccessRole[] }>("/api/v1/roles");
  return data.data;
}

export async function listPermissions() {
  const { data } = await api.get<{ data: CatalogPermission[] }>("/api/v1/permissions");
  return data.data;
}

export async function createRole(payload: {
  name: string;
  slug?: string;
  description?: string | null;
  permission_slugs?: string[];
}) {
  const { data } = await api.post<{ data: AccessRole }>("/api/v1/roles", payload);
  return data.data;
}

export async function updateRole(
  id: number,
  payload: { name?: string; description?: string | null; permission_slugs?: string[] },
) {
  const { data } = await api.put<{ data: AccessRole }>(`/api/v1/roles/${id}`, payload);
  return data.data;
}

export async function deleteRole(id: number) {
  const { data } = await api.delete<{ data: { deleted: boolean } }>(`/api/v1/roles/${id}`);
  return data.data;
}
