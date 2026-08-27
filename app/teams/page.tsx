"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { addTeamMember, createTeam, deleteTeam, listTeams, listUsers, removeTeamMember, updateTeam } from "@/services/users";
import type { Team } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

const SELECT = "h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white";

type TeamFormState = {
  name: string;
  description: string;
  lead_id: string;
  is_active: boolean;
};

function emptyForm(): TeamFormState {
  return { name: "", description: "", lead_id: "", is_active: true };
}

function fromTeam(team: Team): TeamFormState {
  return {
    name: team.name,
    description: team.description ?? "",
    lead_id: team.lead?.id ? String(team.lead.id) : "",
    is_active: team.is_active,
  };
}

function leadId(value: string): number | null {
  return value ? Number(value) : null;
}

export default function TeamsPage() {
  const { can, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TeamFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [memberUserId, setMemberUserId] = useState<Record<number, string>>({});
  const [memberRole, setMemberRole] = useState<Record<number, "member" | "lead">>({});

  const teams = useQuery({
    queryKey: ["teams", { per_page: "100" }],
    queryFn: () => listTeams({ per_page: "100" }),
    enabled: can("teams.view"),
  });
  const people = useQuery({
    queryKey: ["users", { per_page: "100" }],
    queryFn: () => listUsers({ per_page: "100" }),
    enabled: can("users.view") || can("teams.create") || can("teams.update") || can("teams.manage_members"),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["teams"] });
  };
  const setField = <K extends keyof TeamFormState>(key: K, value: TeamFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        lead_id: leadId(form.lead_id),
        is_active: form.is_active,
      };
      if (editingId === "new") {
        return createTeam(payload);
      }
      if (typeof editingId !== "number") {
        throw new Error("Nothing to save");
      }
      return updateTeam(editingId, payload);
    },
    onSuccess: (team) => {
      toast.success(editingId === "new" ? `${team.name} created` : `${team.name} updated`);
      setEditingId(null);
      setForm(emptyForm());
      refresh();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not save this team.")),
  });

  const remove = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      toast.success("Team deleted");
      if (editingId !== "new" && editingId) {
        setEditingId(null);
        setForm(emptyForm());
      }
      refresh();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not delete this team.")),
  });

  const addMember = useMutation({
    mutationFn: ({ teamId, userId, role }: { teamId: number; userId: number; role: "member" | "lead" }) =>
      addTeamMember(teamId, { user_id: userId, membership_role: role }),
    onSuccess: (_, vars) => {
      toast.success("Member added");
      setMemberUserId((current) => ({ ...current, [vars.teamId]: "" }));
      refresh();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not add this member.")),
  });

  const dropMember = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) => removeTeamMember(teamId, userId),
    onSuccess: () => {
      toast.success("Member removed");
      refresh();
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not remove this member.")),
  });

  if (authLoading) return <p className="text-slate-400">Loading teams…</p>;
  if (!can("teams.view")) return <p className="text-rose-300">You do not have permission to view this.</p>;
  if (teams.error) return <p className="text-rose-300">{apiErrorMessage(teams.error, "Unable to load teams.")}</p>;

  const canCreate = can("teams.create");
  const canUpdate = can("teams.update");
  const canDelete = can("teams.delete");
  const canMembers = can("teams.manage_members");
  const peopleOptions = people.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Teams</h1>
          <p className="mt-1 text-sm text-slate-400">Create a team, change its lead, or delete it when the group is no longer needed.</p>
        </div>
        {canCreate && editingId !== "new" && (
          <Button
            onClick={() => {
              setEditingId("new");
              setForm(emptyForm());
            }}
          >
            Add team
          </Button>
        )}
      </div>

      {editingId !== null && (editingId === "new" ? canCreate : canUpdate) && (
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg font-medium">{editingId === "new" ? "New team" : "Edit team"}</p>
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
            <Input placeholder="Team name" value={form.name} onChange={(e) => setField("name", e.target.value)} />
            <select className={SELECT} value={form.lead_id} onChange={(e) => setField("lead_id", e.target.value)}>
              <option value="">No lead</option>
              {peopleOptions.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="min-h-24 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setField("is_active", e.target.checked)} />
            Active team
          </label>
          <Button disabled={!form.name.trim() || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : editingId === "new" ? "Create team" : "Save changes"}
          </Button>
        </Card>
      )}

      {teams.isLoading && <p className="text-slate-400">Loading teams…</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {teams.data?.data.map((team) => {
          const memberIds = new Set((team.members ?? []).map((member) => member.id));
          const candidates = peopleOptions.filter((person) => !memberIds.has(person.id));
          return (
            <Card key={team.id} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-medium">{team.name}</p>
                  <p className="text-sm text-slate-400">{team.description || "No description"}</p>
                </div>
                <Badge tone={team.is_active ? "cyan" : undefined}>{team.is_active ? "active" : "inactive"}</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Lead {team.lead?.name ?? "—"} · {team.members?.length ?? 0} members
              </p>
              {(canUpdate || canDelete) && (
                <div className="flex flex-wrap gap-2">
                  {canUpdate && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingId(team.id);
                        setForm(fromTeam(team));
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={remove.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete ${team.name}? This cannot be undone from the UI.`)) {
                          remove.mutate(team.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              )}
              {canMembers && (
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <p className="text-sm font-medium text-slate-300">Members</p>
                  <ul className="space-y-2 text-sm">
                    {(team.members ?? []).map((member) => (
                      <li key={member.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                        <span>
                          {member.name}
                          {team.lead?.id === member.id ? <span className="ml-2 text-xs text-amber-300">lead</span> : null}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={dropMember.isPending}
                          onClick={() => {
                            if (window.confirm(`Remove ${member.name} from ${team.name}?`)) {
                              dropMember.mutate({ teamId: team.id, userId: member.id });
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                    {(team.members?.length ?? 0) === 0 && <li className="text-slate-500">No members yet.</li>}
                  </ul>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      className={SELECT}
                      value={memberUserId[team.id] ?? ""}
                      onChange={(e) => setMemberUserId((current) => ({ ...current, [team.id]: e.target.value }))}
                    >
                      <option value="">Add a person</option>
                      {candidates.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className={`${SELECT} sm:w-32`}
                      value={memberRole[team.id] ?? "member"}
                      onChange={(e) => setMemberRole((current) => ({ ...current, [team.id]: e.target.value as "member" | "lead" }))}
                    >
                      <option value="member">Member</option>
                      <option value="lead">Lead</option>
                    </select>
                    <Button
                      disabled={!memberUserId[team.id] || addMember.isPending}
                      onClick={() =>
                        addMember.mutate({
                          teamId: team.id,
                          userId: Number(memberUserId[team.id]),
                          role: memberRole[team.id] ?? "member",
                        })
                      }
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {teams.data?.data.length === 0 && <Card>No teams yet.</Card>}
      </div>
    </div>
  );
}
