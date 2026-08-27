"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { getSettings, updateSettings, uploadLogo } from "@/services/settings";
import type { SettingField, SettingsCatalog } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const controlClass =
  "flex min-h-10 w-full rounded-lg border border-border bg-foreground/5 px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50";

function draftFromCatalog(catalog: SettingsCatalog): Record<string, string | number | boolean> {
  const next: Record<string, string | number | boolean> = {};
  for (const group of catalog.groups) {
    for (const field of group.fields) {
      if (field.type === "logo") continue;
      if (field.type === "secret") {
        next[field.key] = "";
        continue;
      }
      if (field.type === "bool") {
        next[field.key] = Boolean(field.value);
        continue;
      }
      if (field.type === "int") {
        next[field.key] = typeof field.value === "number" ? field.value : Number(field.value ?? 0);
        continue;
      }
      next[field.key] = field.value == null ? "" : String(field.value);
    }
  }
  return next;
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: SettingField;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
}) {
  if (field.type === "bool") {
    return (
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-amber-400"
        />
        Enabled
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <select className={controlClass} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
        {(field.options ?? []).map((option) => (
          <option key={option || "(default)"} value={option} className="bg-background">
            {option === "" ? "(default)" : option === "null" ? "null (disabled)" : option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "secret" && field.multiline) {
    return (
      <textarea
        rows={6}
        className={controlClass}
        placeholder={field.placeholder ?? (field.configured ? `Configured ${field.mask ?? ""}` : "Not set")}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === "secret") {
    return (
      <Input
        type="password"
        autoComplete="new-password"
        placeholder={field.placeholder ?? (field.configured ? `Configured ${field.mask ?? ""}` : "Not set")}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.multiline) {
    return <textarea rows={4} className={controlClass} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />;
  }

  return (
    <Input
      type={field.type === "int" ? "number" : "text"}
      value={field.type === "int" ? Number(value ?? 0) : String(value ?? "")}
      onChange={(event) => onChange(field.type === "int" ? Number(event.target.value) : event.target.value)}
    />
  );
}

export default function SettingsPage() {
  const { can, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [groupId, setGroupId] = useState("app");
  const [draft, setDraft] = useState<Record<string, string | number | boolean>>({});

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    enabled: can("settings.manage"),
  });

  useEffect(() => {
    if (settings.data) setDraft(draftFromCatalog(settings.data));
  }, [settings.data]);

  const activeGroup = useMemo(
    () => settings.data?.groups.find((group) => group.id === groupId) ?? settings.data?.groups[0],
    [settings.data, groupId],
  );

  const saveMutation = useMutation({
    mutationFn: () => {
      const values: Record<string, string | number | boolean | null> = {};
      for (const group of settings.data?.groups ?? []) {
        for (const field of group.fields) {
          if (field.type === "logo") continue;
          const current = draft[field.key];
          if (field.type === "secret" && (current === "" || current == null)) continue;
          values[field.key] = current ?? null;
        }
      }
      return updateSettings(values);
    },
    onSuccess: (catalog) => {
      queryClient.setQueryData(["settings"], catalog);
      queryClient.invalidateQueries({ queryKey: ["branding"] });
      toast.success("Settings saved. They apply on the next request without editing .env.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Unable to save settings.")),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["branding"] });
      toast.success("Logo updated.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Unable to upload logo.")),
  });

  if (authLoading) return <p className="text-muted">Loading settings…</p>;
  if (!can("settings.manage")) {
    return <p className="text-rose-700 dark:text-rose-300">Only the CTO can change organization settings.</p>;
  }
  if (settings.error) return <p className="text-rose-700 dark:text-rose-300">{apiErrorMessage(settings.error, "Unable to load settings.")}</p>;
  if (settings.isLoading || !activeGroup) return <p className="text-muted">Loading settings…</p>;

  const logoField = activeGroup.fields.find((field) => field.type === "logo");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Organization</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Overrides live in the database (encrypted). They sit on top of <code className="text-muted">.env</code>. APP_KEY and
            database credentials stay in the environment file so this screen cannot lock you out.
          </p>
        </div>
        <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit space-y-1 p-3">
          {settings.data?.groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setGroupId(group.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                activeGroup.id === group.id ? "bg-amber-400/10 text-amber-800 dark:text-amber-100" : "text-muted hover:bg-foreground/5"
              }`}
            >
              {group.title}
            </button>
          ))}
        </Card>
        <Card className="space-y-5">
          <div>
            <CardTitle className="text-base text-foreground">{activeGroup.title}</CardTitle>
            <p className="mt-1 text-sm text-muted">{activeGroup.description}</p>
            {activeGroup.id === "git" && (
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                Organization, OAuth, and token values on this screen are what the{" "}
                <a href="/git" className="underline hover:text-amber-800 dark:hover:text-amber-800 dark:text-amber-100">
                  Git workspace
                </a>{" "}
                uses to list repos and start code reviews.
              </p>
            )}
          </div>
          {logoField && (
            <div className="space-y-2">
              <label className="block text-sm text-muted">{logoField.label}</label>
              {typeof logoField.value === "string" && logoField.value && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoField.value} alt="App logo" className="h-12 w-12 rounded-lg object-contain bg-foreground/5" />
              )}
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) logoMutation.mutate(file);
                }}
              />
              {logoField.help && <p className="text-xs text-muted">{logoField.help}</p>}
            </div>
          )}
          {activeGroup.fields
            .filter((field) => field.type !== "logo")
            .map((field) => (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-muted">{field.label}</label>
                  <span className="font-mono text-[10px] text-muted">{field.key}</span>
                </div>
                <FieldControl
                  field={field}
                  value={draft[field.key] ?? (field.type === "bool" ? false : field.type === "int" ? 0 : "")}
                  onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
                />
                {field.help && <p className="text-xs text-muted">{field.help}</p>}
                {field.type === "secret" && field.configured && (
                  <p className="text-xs text-muted">Current value {field.mask}. Leave blank to keep it.</p>
                )}
              </div>
            ))}
        </Card>
      </div>
    </div>
  );
}
