import api from "@/lib/api";
import type { AppNotification } from "@/types";

export async function getNotifications() {
  const { data } = await api.get<{ data: AppNotification[]; meta: { unread: number } }>("/api/v1/notifications");
  return { items: data.data, unread: data.meta.unread };
}

export async function markNotificationRead(id: string) {
  const { data } = await api.post(`/api/v1/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post("/api/v1/notifications/read-all");
  return data;
}
