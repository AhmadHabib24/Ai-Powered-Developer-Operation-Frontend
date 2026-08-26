"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { listRoles } from "@/services/roles";
import { createUser, deleteUser, listUsers, updateUser } from "@/services/users";
import type { User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

const SELECT = "h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white";
const FALLBACK_ROLES = [
  { slug: "developer", label: "Developer" },
  { slug: "project_manager", label: "Project manager" },
  { slug: "super_admin", label: "Super admin / CTO" },
];
const EXPERIENCE = ["junior", "mid", "senior", "lead", "principal"] as const;
const AVAILABILITY = ["available", "busy", "away", "unavailable"] as const;

type PersonFormState = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
  experience_level: string;
  availability_status: string;
  weekly_capacity_hours: string;
  phone: string;
  timezone: string;
  bio: string;
  is_active: boolean;
};

function emptyForm(): PersonFormState {
  return {
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "developer",
    experience_level: "mid",
    availability_status: "available",
    weekly_capacity_hours: "40",
    phone: "",
    timezone: "UTC",
    bio: "",
    is_active: true,
  };
}

function fromUser(person: User): PersonFormState {
  return {
    name: person.name,
    email: person.email,
    password: "",
    password_confirmation: "",
    role: person.roles?.[0] ?? "developer",
    experience_level: person.experience_level || "mid",
    availability_status: person.availability_status || "available",
    weekly_capacity_hours: String(person.weekly_capacity_hours ?? 40),
    phone: person.phone ?? "",
    timezone: person.timezone ?? "UTC",
    bio: person.bio ?? "",
    is_active: person.is_active,
  };
}

export default function PeoplePage() {
  const { user: me, can, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PersonFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["users", { per_page: "100" }],
    queryFn: () => listUsers({ per_page: "100" }),
    enabled: can("users.view"),
  });
  const roles = useQuery({
    queryKey: ["roles"],
    queryFn: listRoles,
    enabled: can("roles.view"),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["users"] });
  const setField = <K extends keyof PersonFormState>(key: K, value: PersonFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        experience_level: form.experience_level,
        availability_status: form.availability_status,
        weekly_capacity_hours: Number(form.weekly_capacity_hours || 40),
        phone: form.phone.trim() || null,
        timezone: form.timezone.trim() || "UTC",
        bio: form.bio.trim() || null,
      };
      if (editingId === "new") {
        return createUser({
          ...payload,
          password: form.password,
          password_confirmation: form.password_confirmation,
        });
      }
      if (typeof editingId !== "number") {
        throw new Error("Nothing to save");
      }
      const update: Parameters<typeof updateUser>[1] = { ...payload };
      if (me?.id === editingId) {
        delete update.role;
      }
      if (form.password) {
        update.password = form.password;
        update.password_confirmation = form.password_confirmation;
      }
      if (can("users.update")) {
        update.is_active = form.is_active;
      }
      return updateUser(editingId, update);
    },
    onSuccess: (person) => {
      toast.success(editingId === "new" ? `${person.name} added` : `${person.name} updated`);
      setEditingId(null);
      setForm(emptyForm());
      refresh();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not save this person.")),
  });

  const remove = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("Person removed");
      refresh();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not remove this person.")),
  });

  if (authLoading) return <p className="text-slate-400">Loading people…</p>;
  if (!can("users.view")) return <p className="text-rose-300">You do not have permission to view this.</p>;
  if (error) return <p className="text-rose-300">{apiErrorMessage(error, "Unable to load people.")}</p>;
  if (isLoading) return <p className="text-slate-400">Loading people…</p>;

  const isEditingSelf = typeof editingId === "number" && editingId === me?.id;
  const canCreate = can("users.create");
  const canUpdate = can("users.update");
  const canDelete = can("users.delete");
  const roleOptions =
    roles.data?.map((role) => ({ slug: role.slug, label: role.name })) ?? FALLBACK_ROLES;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">People</h1>
          <p className="mt-1 text-sm text-slate-400">Add teammates, update roles, or remove people who should no longer have access.</p>
        </div>
        {canCreate && editingId !== "new" && (
          <Button
            onClick={() => {
              setEditingId("new");
              setForm(emptyForm());
            }}
          >
            Add person
          </Button>
        )}
      </div>

      {editingId !== null && (editingId === "new" ? canCreate : canUpdate || isEditingSelf) && (
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-medium">{editingId === "new" ? "New person" : "Edit person"}</p>
              <p className="text-sm text-slate-400">
                {editingId === "new" ? "They can sign in as soon as you save." : "Leave password blank to keep the current one."}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
              }}
            >
              Cancel
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Full name" value={form.name} onChange={(e) => setField("name", e.target.value)} />
            <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
            <Input type="password" placeholder={editingId === "new" ? "Password (min 8)" : "New password (optional)"} value={form.password} onChange={(e) => setField("password", e.target.value)} />
            <Input type="password" placeholder="Confirm password" value={form.password_confirmation} onChange={(e) => setField("password_confirmation", e.target.value)} />
            {!isEditingSelf && (
              <select className={SELECT} value={form.role} onChange={(e) => setField("role", e.target.value)}>
                {roleOptions.map((role) => (
                  <option key={role.slug} value={role.slug}>
                    {role.label}
                  </option>
                ))}
              </select>
            )}
            <select className={SELECT} value={form.experience_level} onChange={(e) => setField("experience_level", e.target.value)}>
              {EXPERIENCE.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <select className={SELECT} value={form.availability_status} onChange={(e) => setField("availability_status", e.target.value)}>
              {AVAILABILITY.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <Input type="number" min={0} max={80} placeholder="Weekly hours" value={form.weekly_capacity_hours} onChange={(e) => setField("weekly_capacity_hours", e.target.value)} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
            <Input placeholder="Timezone" value={form.timezone} onChange={(e) => setField("timezone", e.target.value)} />
          </div>
          <textarea
            className="min-h-24 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
            placeholder="Bio"
            value={form.bio}
            onChange={(e) => setField("bio", e.target.value)}
          />
          {editingId !== "new" && canUpdate && (
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setField("is_active", e.target.checked)} />
              Active account
            </label>
          )}
          <Button disabled={!form.name || !form.email || save.isPending || (editingId === "new" && (!form.password || form.password.length < 8))} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : editingId === "new" ? "Create person" : "Save changes"}
          </Button>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {data?.data.map((person) => (
          <Card key={person.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-medium">{person.name}</p>
                <p className="text-sm text-slate-400">{person.email}</p>
              </div>
              <Badge>{person.experience_level}</Badge>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {person.availability_status} · {person.weekly_capacity_hours}h capacity
              {!person.is_active ? " · inactive" : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {person.roles?.map((role) => (
                <Badge key={role} tone="cyan">
                  {role.replace("_", " ")}
                </Badge>
              ))}
            </div>
            {(canUpdate || canDelete) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {canUpdate && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingId(person.id);
                      setForm(fromUser(person));
                    }}
                  >
                    Edit
                  </Button>
                )}
                {canDelete && person.id !== me?.id && (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm(`Remove ${person.name} from NOVA? They will no longer be able to sign in.`)) {
                        remove.mutate(person.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
        {data?.data.length === 0 && <Card>No people yet.</Card>}
      </div>
    </div>
  );
}
