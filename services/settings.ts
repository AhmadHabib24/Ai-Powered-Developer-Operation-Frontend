import api from "@/lib/api";
import type { Branding, SettingsCatalog } from "@/types";

export async function getBranding() {
  const { data } = await api.get<{ data: Branding }>("/api/v1/settings/branding");
  return data.data;
}

export async function getSettings() {
  const { data } = await api.get<{ data: SettingsCatalog }>("/api/v1/settings");
  return data.data;
}

export async function updateSettings(values: Record<string, string | number | boolean | null>) {
  const { data } = await api.put<{ data: SettingsCatalog }>("/api/v1/settings", { values });
  return data.data;
}

export async function uploadLogo(file: File) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await api.post<{ data: Branding }>("/api/v1/settings/logo", body);
  return data.data;
}
