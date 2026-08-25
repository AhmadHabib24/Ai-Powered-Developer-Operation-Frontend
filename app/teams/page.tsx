"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { createTeam, listTeams } from "@/services/users";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function TeamsPage() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["teams"], queryFn: listTeams });
  const mutation = useMutation({
    mutationFn: () => createTeam({ name }),
    onSuccess: () => {
      setName("");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team created");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">Teams</h1>
      {can("teams.create") && (
        <Card className="flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Team name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button disabled={!name || mutation.isPending} onClick={() => mutation.mutate()}>
            Create
          </Button>
        </Card>
      )}
      {isLoading && <p className="text-slate-400">Loading teams…</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.data.map((team) => (
          <Card key={team.id}>
            <p className="text-lg font-medium">{team.name}</p>
            <p className="text-sm text-slate-400">{team.description}</p>
            <p className="mt-3 text-xs text-slate-500">Lead {team.lead?.name ?? "—"} · {team.members?.length ?? 0} members</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
