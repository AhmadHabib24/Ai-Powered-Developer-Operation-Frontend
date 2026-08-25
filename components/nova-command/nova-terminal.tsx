"use client";

import { MeshTerminal } from "@/components/nova-command/mesh-terminal";
import { apiErrorMessage } from "@/lib/api";
import { playNovaTick } from "@/lib/nova-audio";
import { getLiveActivity, type LiveActivityEvent } from "@/services/activity";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

export function NovaTerminal({ enabled }: { enabled: boolean }) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const seen = useRef(new Set<number>());
  const booted = useRef(false);
  const [kernel] = useState(() => [
    { id: -3, line: "NOVA kernel · mesh handshake" },
    { id: -2, line: "uplink: org.audit · live" },
    { id: -1, line: "awaiting operator traffic" },
  ]);

  const feed = useQuery({
    queryKey: ["activity", "live"],
    queryFn: () => getLiveActivity(),
    enabled,
    refetchInterval: enabled ? 2500 : false,
  });

  const events: Array<Pick<LiveActivityEvent, "id" | "line">> = [...kernel, ...(feed.data ?? [])];

  useEffect(() => {
    const incoming = (feed.data ?? []).filter((item) => !seen.current.has(item.id));
    if (booted.current) {
      incoming.forEach(() => playNovaTick());
    } else if ((feed.data ?? []).length > 0 || feed.isFetched) {
      booted.current = true;
    }
    incoming.forEach((item) => seen.current.add(item.id));
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [feed.data, feed.isFetched]);

  return (
    <MeshTerminal title="Live ops log" liveLabel={feed.isFetching ? "sync" : "live"} className="h-full min-h-0 lg:min-h-[280px]" bodyRef={scroller}>
      <div className="space-y-1">
        {feed.error && <p className="text-rose-300">{apiErrorMessage(feed.error, "Audit uplink denied.")}</p>}
        {events.map((item) => (
          <p key={item.id} className={item.id < 0 ? "text-cyan-500/80" : "text-cyan-100"}>
            <span className="text-cyan-700">›</span> {item.line}
          </p>
        ))}
        {(feed.data ?? []).length === 0 && !feed.error && (
          <p className="text-cyan-700">No operator events yet. Timer starts, assignments, and project edits appear here as they happen.</p>
        )}
      </div>
    </MeshTerminal>
  );
}
