import api from "@/lib/api";

export interface LiveActivityEvent {
  id: number;
  action: string;
  line: string;
  actor?: string | null;
  created_at?: string | null;
}

export async function getLiveActivity(afterId?: number) {
  const { data } = await api.get<{ data: LiveActivityEvent[]; meta?: { latest_id?: number } }>("/api/v1/activity/live", {
    params: afterId ? { after_id: afterId } : undefined,
  });
  return data.data;
}

export interface TheaterTask {
  id: number;
  title: string;
  status: string;
  priority: string;
  assignee?: string | null;
  project?: string | null;
  timer: boolean;
}

export interface TaskBoard {
  working: TheaterTask[];
  pending: TheaterTask[];
  review: TheaterTask[];
  blocked: TheaterTask[];
  done: TheaterTask[];
  counts: {
    working: number;
    pending: number;
    review: number;
    blocked: number;
    done: number;
    timers: number;
  };
}

export async function getTaskBoard() {
  const { data } = await api.get<{ data: TaskBoard }>("/api/v1/activity/tasks");
  return data.data;
}

export interface TechNewsItem {
  id: string;
  title: string;
  url: string;
  points: number;
  author?: string | null;
  created_at?: string | null;
}

export async function getTechNews() {
  const { data } = await api.get<{ data: TechNewsItem[]; meta?: { source?: string; error?: string | null } }>("/api/v1/activity/news");
  return { items: data.data, source: data.meta?.source ?? "Hacker News", error: data.meta?.error ?? null };
}
