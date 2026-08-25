"use client";

import { Button } from "@/components/ui/button";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/notifications";
import type { AppNotification } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  const seenUnread = useRef<number | null>(null);

  const feed = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 10_000,
  });

  const unread = feed.data?.unread ?? 0;
  const items = feed.data?.items ?? [];

  useEffect(() => {
    if (seenUnread.current === null) {
      seenUnread.current = unread;
      return;
    }
    if (unread > seenUnread.current) {
      const fresh = feed.data?.items.find((item) => !item.read_at);
      toast.message(fresh?.title ?? "New notification", { description: fresh?.body });
    }
    seenUnread.current = unread;
  }, [unread, feed.data]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const readOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const openItem = (item: AppNotification) => {
    if (!item.read_at) readOne.mutate(item.id);
    setOpen(false);
    if (item.href) router.push(item.href);
  };

  return (
    <div ref={root} className="relative">
      <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => setOpen((value) => !value)}>
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-cyan-400 px-1 text-[10px] font-semibold text-slate-950">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-14 max-sm:mt-0 max-sm:w-auto">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Notifications</p>
            {unread > 0 && (
              <button type="button" className="text-[11px] text-slate-400 hover:text-white" onClick={() => readAll.mutate()}>
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-500">No notifications yet.</p>}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openItem(item)}
                className={`block w-full border-b border-white/5 px-3 py-3 text-left hover:bg-white/5 ${item.read_at ? "opacity-60" : ""}`}
              >
                <p className="text-sm text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">{item.body}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
