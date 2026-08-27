"use client";

import { MeshTerminal } from "@/components/nova-command/mesh-terminal";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getTechNews } from "@/services/activity";
import { useQuery } from "@tanstack/react-query";

export function NovaNewsTerminal({ enabled, className }: { enabled: boolean; className?: string }) {
  const news = useQuery({
    queryKey: ["activity", "news"],
    queryFn: getTechNews,
    enabled,
    refetchInterval: enabled ? 60_000 : false,
    staleTime: 30_000,
  });

  return (
    <MeshTerminal
      title="Tech / world wire"
      liveLabel={news.data?.source ? news.data.source : news.isFetching ? "sync" : "live"}
      className={cn("h-48", className)}
    >
      {news.error && <p className="text-rose-700 dark:text-rose-300">{apiErrorMessage(news.error, "News uplink denied.")}</p>}
      {news.data?.error && <p className="text-amber-800 dark:text-amber-200">{news.data.error}</p>}
      {(news.data?.items ?? []).map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-amber-800 dark:text-amber-100 hover:text-foreground"
        >
          <span className="text-amber-700">›</span> {item.points > 0 ? `${item.points}pts · ` : ""}
          {item.title}
        </a>
      ))}
      {news.isFetched && (news.data?.items ?? []).length === 0 && !news.data?.error && (
        <p className="text-amber-700">No headlines in the current Hacker News front page response.</p>
      )}
    </MeshTerminal>
  );
}
