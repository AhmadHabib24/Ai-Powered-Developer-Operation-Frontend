import api from "@/lib/api";
import type { NovaAction, NovaCapabilities, NovaConversation, NovaTurn } from "@/types";

export async function getNovaCapabilities() {
  const { data } = await api.get<{ data: NovaCapabilities }>("/api/v1/nova/capabilities");
  return data.data;
}

export async function listNovaConversations() {
  const { data } = await api.get<{ data: NovaConversation[] }>("/api/v1/nova/conversations");
  return data.data;
}

export async function getNovaConversation(id: number | string) {
  const { data } = await api.get<{ data: NovaConversation }>(`/api/v1/nova/conversations/${id}`);
  return data.data;
}

export async function sendNovaChat(payload: { message: string; conversation_id?: number; project_id?: number }) {
  const { data } = await api.post<{ data: NovaTurn }>("/api/v1/nova/chat", payload);
  return data.data;
}

export async function sendNovaVoice(payload: {
  audio?: Blob;
  transcript?: string;
  conversation_id?: number;
  project_id?: number;
}) {
  const body = new FormData();
  if (payload.audio) {
    body.append("audio", payload.audio, "nova.webm");
  }
  if (payload.transcript) {
    body.append("transcript", payload.transcript);
  }
  if (payload.conversation_id) {
    body.append("conversation_id", String(payload.conversation_id));
  }
  if (payload.project_id) {
    body.append("project_id", String(payload.project_id));
  }
  const { data } = await api.post<{ data: NovaTurn }>("/api/v1/nova/voice", body);
  return data.data;
}

export async function approveNovaAction(id: number) {
  const { data } = await api.post<{ data: NovaTurn }>(`/api/v1/ai/actions/${id}/approve`);
  return data.data;
}

export async function rejectNovaAction(id: number) {
  const { data } = await api.post<{ data: NovaAction }>(`/api/v1/ai/actions/${id}/reject`);
  return data.data;
}
