"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { useBranding } from "@/hooks/use-branding";
import { brandAssistantName } from "@/lib/brand";
import { novaChatSchema } from "@/schemas/auth";
import { getNovaCapabilities, getNovaConversation, listNovaConversations, sendNovaChat, sendNovaVoice } from "@/services/nova";
import type { NovaAction, NovaConversation, NovaMessage } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

function NovaChatPage() {
  const { can, user, isLoading } = useAuth();
  const branding = useBranding();
  const assistant = brandAssistantName(branding.data?.assistant_name);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project_id") ? Number(searchParams.get("project_id")) : undefined;
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [messages, setMessages] = useState<NovaMessage[]>([]);
  const [pending, setPending] = useState<NovaAction[]>([]);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const bottom = useRef<HTMLDivElement | null>(null);
  const form = useForm<z.infer<typeof novaChatSchema>>({ resolver: zodResolver(novaChatSchema), defaultValues: { message: "" } });

  const capabilities = useQuery({ queryKey: ["nova", "capabilities"], queryFn: getNovaCapabilities, enabled: can("ai.use") });
  const conversations = useQuery({ queryKey: ["nova", "conversations"], queryFn: listNovaConversations, enabled: can("ai.use") });

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const applyTurn = (turn: {
    conversation: NovaConversation;
    messages?: NovaMessage[];
    pending_actions?: NovaAction[];
    message?: string;
  }) => {
    setConversationId(turn.conversation.id);
    setMessages(turn.messages ?? turn.conversation.messages ?? []);
    setPending(turn.pending_actions ?? turn.conversation.pending_actions ?? []);
    queryClient.invalidateQueries({ queryKey: ["nova", "conversations"] });
  };

  const chatMutation = useMutation({
    mutationFn: (message: string) => sendNovaChat({ message, conversation_id: conversationId, project_id: projectId }),
    onSuccess: applyTurn,
    onError: (error) => toast.error(apiErrorMessage(error, `${assistant} could not reply.`)),
  });

  const voiceMutation = useMutation({
    mutationFn: (audio: Blob) => sendNovaVoice({ audio, conversation_id: conversationId, project_id: projectId }),
    onSuccess: applyTurn,
    onError: (error) => toast.error(apiErrorMessage(error, "Voice could not be processed.")),
  });

  const loadConversation = async (id: number) => {
    const conversation = await getNovaConversation(id);
    setConversationId(conversation.id);
    setMessages(conversation.messages ?? []);
    setPending(conversation.pending_actions ?? []);
  };

  const sttReady = capabilities.data?.stt.configured ?? false;
  const busy = chatMutation.isPending || voiceMutation.isPending;

  const startRecording = async () => {
    if (!sttReady) {
      toast.error(`Speech-to-text is not configured. Set SPEECH_TO_TEXT_PROVIDER in Settings.`);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const media = new MediaRecorder(stream);
    chunks.current = [];
    media.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    media.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks.current, { type: media.mimeType || "audio/webm" });
      voiceMutation.mutate(blob);
    };
    recorder.current = media;
    media.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recorder.current?.stop();
    setRecording(false);
  };

  const greeting = useMemo(
    () => `Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}${user?.name ? `, ${user.name}` : ""}. Ask about a project, a task, or assign work by name.`,
    [user?.name],
  );

  if (isLoading) {
    return <p className="text-muted">Loading {assistant}…</p>;
  }

  if (!can("ai.use")) {
    return <p className="text-rose-700 dark:text-rose-300">You do not have permission to talk to {assistant}.</p>;
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[220px_1fr]">
      <Card className="h-fit space-y-3">
        <CardTitle>Conversations</CardTitle>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setConversationId(undefined);
            setMessages([]);
            setPending([]);
          }}
        >
          New chat
        </Button>
        <ul className="space-y-1 text-sm">
          {(conversations.data ?? []).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`w-full rounded-lg px-2 py-1.5 text-left ${conversationId === item.id ? "bg-amber-400/10 text-amber-800 dark:text-amber-100" : "text-muted hover:bg-foreground/5"}`}
                onClick={() => loadConversation(item.id)}
              >
                {item.title || `Chat ${item.id}`}
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Assistant</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">Talk to {assistant}</h1>
          <p className="mt-2 text-sm text-muted">
            Live tools over your projects. Writes wait for confirmation unless a project is in auto-execute.
          </p>
          {(recording || voiceMutation.isPending || chatMutation.isPending) && (
            <p className="mt-2 text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">
              {recording
                ? branding.data?.voice.listening ?? "Listening"
                : voiceMutation.isPending || chatMutation.isPending
                  ? branding.data?.voice.thinking ?? "Thinking"
                  : branding.data?.voice.speaking ?? "Speaking"}
            </p>
          )}
        </div>
        <Card className="flex min-h-[420px] flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.length === 0 && <p className="text-sm text-muted">{greeting}</p>}
            {messages.map((item) => (
              <div key={item.id} className={`rounded-xl px-3 py-2 text-sm text-foreground ${item.role === "user" ? "ml-4 bg-amber-400/10 sm:ml-8" : "mr-4 bg-foreground/5 sm:mr-8"}`}>
                <p className="mb-1 text-[10px] uppercase tracking-wide text-muted">{item.role}</p>
                <p className="whitespace-pre-wrap">{item.content}</p>
              </div>
            ))}
            {pending.map((action) => (
              <div key={action.id} className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-foreground">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Pending: {action.tool_name.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-100/80">Say yes in this chat to confirm. Mode: {action.permission_mode}</p>
                  </div>
                  <Badge>approval</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" disabled={busy} onClick={() => chatMutation.mutate("Yes")}>
                    Yes, do it
                  </Button>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => chatMutation.mutate("No, cancel that.")}>
                    Not now
                  </Button>
                </div>
              </div>
            ))}
            <div ref={bottom} />
          </div>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={form.handleSubmit((values) => {
              chatMutation.mutate(values.message);
              form.reset({ message: "" });
            })}
          >
            <Input className="min-w-0 flex-1" disabled={busy} placeholder="Ask about CRM status, overdue work, or assign a task…" {...form.register("message")} />
            <div className="flex gap-2">
              <Button type="submit" disabled={busy} className="flex-1 sm:flex-none">
                <Send className="h-4 w-4" />
                Send
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!sttReady || busy}
                title={sttReady ? "Hold to talk" : "Speech-to-text is not configured"}
                onClick={() => (recording ? stopRecording() : startRecording())}
                className="flex-1 sm:flex-none"
              >
                <Mic className="h-4 w-4" />
                {recording ? "Stop" : "Voice"}
              </Button>
            </div>
          </form>
          {!sttReady && (
            <p className="mt-2 text-xs text-muted">Microphone is disabled until SPEECH_TO_TEXT_PROVIDER is configured. Typed chat still uses live tools.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function NovaPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading NORA…</p>}>
      <NovaChatPage />
    </Suspense>
  );
}
