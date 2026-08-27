"use client";

import { RequirePermission } from "@/components/auth/require-permission";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
import { groupPermissions, sidebarLabelForPermission } from "@/lib/access";
import { NAV_LINKS } from "@/lib/nav";
import { useAuth } from "@/providers/auth-provider";
import { createRole, deleteRole, listPermissions, listRoles, updateRole } from "@/services/roles";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function RolesPage() {
  const { user, can } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newName, setNewName] = useState("");

  const roles = useQuery({ queryKey: ["roles"], queryFn: listRoles, enabled: can("roles.view") });
  const catalog = useQuery({ queryKey: ["permissions"], queryFn: listPermissions, enabled: can("roles.view") });

  const current = roles.data?.find((role) => role.id === selectedId) ?? roles.data?.[0];
  const locked = current?.slug === "super_admin";
  const canManage = can("roles.manage");
  const groups = useMemo(() => groupPermissions(catalog.data ?? []), [catalog.data]);
  const sidebarLinks = NAV_LINKS.filter((link) => link.permission);

  useEffect(() => {
    if (!current) return;
    setSelectedId(current.id);
    setSelected(new Set(current.permissions ?? []));
    setName(current.name);
    setDescription(current.description ?? "");
  }, [current?.id, current?.permissions, current?.name, current?.description]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["roles"] });

  const save = useMutation({
    mutationFn: () =>
      updateRole(current!.id, {
        name: name.trim(),
        description: description.trim() || null,
        permission_slugs: locked ? undefined : [...selected],
      }),
    onSuccess: (role) => {
      toast.success(`Saved ${role.name}. People on this role should refresh to see sidebar changes.`);
      refresh();
      if (user?.roles?.includes(role.slug)) {
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not save this role.")),
  });

  const create = useMutation({
    mutationFn: () => createRole({ name: newName.trim(), permission_slugs: [] }),
    onSuccess: (role) => {
      setNewName("");
      setSelectedId(role.id);
      refresh();
      toast.success(`${role.name} created. Grant sidebar and operation access, then save.`);
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not create this role.")),
  });

  const remove = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      setSelectedId(null);
      refresh();
      toast.success("Role deleted");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Could not delete this role.")),
  });

  const toggle = (slug: string, on: boolean) => {
    if (locked || !canManage) return;
    setSelected((currentSet) => {
      const next = new Set(currentSet);
      if (on) next.add(slug);
      else next.delete(slug);
      return next;
    });
  };

  const toggleGroup = (slugs: string[], on: boolean) => {
    if (locked || !canManage) return;
    setSelected((currentSet) => {
      const next = new Set(currentSet);
      for (const slug of slugs) {
        if (on) next.add(slug);
        else next.delete(slug);
      }
      return next;
    });
  };

  return (
    <RequirePermission permission="roles.view">
      {roles.error || catalog.error ? (
        <p className="text-rose-300">{apiErrorMessage(roles.error ?? catalog.error, "Unable to load roles.")}</p>
      ) : roles.isLoading || catalog.isLoading ? (
        <p className="text-slate-400">Loading roles…</p>
      ) : !current ? (
        <p className="text-slate-400">No roles yet.</p>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Access control</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Roles</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Sidebar links appear only when the matching view permission is on. Create, edit, and delete buttons follow the operation grants below.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="space-y-3">
              {(roles.data ?? []).map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedId(role.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${
                    role.id === current.id ? "border-amber-400/40 bg-amber-400/10" : "border-white/10 bg-slate-900/70"
                  }`}
                >
                  <p className="font-medium text-white">{role.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {role.users_count ?? 0} people · {(role.permissions ?? []).length} grants
                    {role.is_system ? " · system" : ""}
                  </p>
                </button>
              ))}
              {canManage && (
                <Card className="space-y-3">
                  <Input placeholder="New role name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <Button disabled={!newName.trim() || create.isPending} onClick={() => create.mutate()}>
                    Add role
                  </Button>
                </Card>
              )}
            </div>
            <Card className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-3">
                  <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canManage} />
                  <textarea
                    className="min-h-20 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
                    placeholder="What this role is for"
                    value={description}
                    disabled={!canManage}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                {canManage && !current.is_system && (
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete ${current.name}? People must be moved off this role first.`)) {
                        remove.mutate(current.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
              {locked && (
                <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                  Super Admin always keeps every permission so you cannot lock yourself out.
                </p>
              )}
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-slate-300">Sidebar</h2>
                <p className="text-xs text-slate-500">My work is always visible. Everything else follows these toggles.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {sidebarLinks.map((link) => (
                    <label key={link.href} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        className="accent-amber-400"
                        checked={selected.has(link.permission!)}
                        disabled={locked || !canManage}
                        onChange={(e) => toggle(link.permission!, e.target.checked)}
                      />
                      {link.label}
                    </label>
                  ))}
                </div>
              </section>
              {groups.map((group) => {
                const slugs = group.items.map((item) => item.slug);
                const allOn = slugs.every((slug) => selected.has(slug));
                return (
                  <section key={group.group} className="space-y-3 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-medium text-slate-300">{group.label}</h2>
                      {canManage && !locked && (
                        <button type="button" className="text-xs text-amber-300" onClick={() => toggleGroup(slugs, !allOn)}>
                          {allOn ? "Clear group" : "Allow all"}
                        </button>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.items.map((item) => {
                        const nav = sidebarLabelForPermission(item.slug);
                        return (
                          <label key={item.slug} className="flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200">
                            <input
                              type="checkbox"
                              className="mt-1 accent-amber-400"
                              checked={selected.has(item.slug)}
                              disabled={locked || !canManage}
                              onChange={(e) => toggle(item.slug, e.target.checked)}
                            />
                            <span>
                              <span className="block">{item.name}</span>
                              <span className="block text-xs text-slate-500">
                                {nav ? `Sidebar: ${nav}. ` : ""}
                                {item.description}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
              {canManage && (
                <Button disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>
                  {save.isPending ? "Saving…" : "Save access"}
                </Button>
              )}
            </Card>
          </div>
        </div>
      )}
    </RequirePermission>
  );
}
