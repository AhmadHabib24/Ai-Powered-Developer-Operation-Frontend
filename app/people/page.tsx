"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/api";
import { listUsers } from "@/services/users";
import { useQuery } from "@tanstack/react-query";

export default function PeoplePage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["users"], queryFn: () => listUsers() });

  if (error) return <p className="text-rose-300">{apiErrorMessage(error, "Unable to load people.")}</p>;
  if (isLoading) return <p className="text-slate-400">Loading people…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">People</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.data.map((user) => (
          <Card key={user.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-medium">{user.name}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
              <Badge>{user.experience_level}</Badge>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {user.availability_status} · {user.weekly_capacity_hours}h capacity
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {user.roles?.map((role) => (
                <Badge key={role} tone="cyan">
                  {role.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
