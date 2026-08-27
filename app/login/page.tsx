"use client";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { brandAppName, BRAND } from "@/lib/brand";
import { loginSchema } from "@/schemas/auth";
import { login } from "@/services/auth";
import { useAuth } from "@/providers/auth-provider";
import { useBranding } from "@/hooks/use-branding";
import { userCanOpenCommand } from "@/lib/nav";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import type { ApiError } from "@/types";
import axios from "axios";

type FormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { markSignedIn } = useAuth();
  const branding = useBranding();
  const appName = brandAppName(branding.data?.app_name);
  const form = useForm<FormValues>({ resolver: zodResolver(loginSchema) });
  const mutation = useMutation({
    mutationFn: (values: FormValues) => login(values.email, values.password),
    onSuccess: async (user) => {
      markSignedIn(user);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success(`Welcome back, ${user.name}`);
      router.replace(userCanOpenCommand(user.permissions) ? "/dashboard" : "/me");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? ((error.response?.data as ApiError | undefined)?.message ?? "Unable to sign in")
        : "Unable to sign in";
      toast.error(message);
    },
  });

  return (
    <div className="mx-auto grid min-h-screen max-w-md place-items-center p-6">
      <Card className="w-full space-y-6 border-amber-400/20 bg-[#1e293b]/90 shadow-[0_0_60px_rgba(245,158,11,0.12)]">
        <div className="text-center">
          {branding.data?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.data.logo_url} alt="" className="mx-auto mb-4 h-16 w-16 rounded-2xl object-contain" />
          ) : (
            <BrandMark variant="wordmark" className="mx-auto mb-4 h-16 w-auto max-w-full" />
          )}
          <p className="text-[10px] uppercase tracking-[0.32em] text-amber-400">{BRAND.tagline}</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Sign in to {appName}</h1>
          <p className="mt-1 text-sm text-slate-400">Command center and developer workspace.</p>
        </div>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Email</label>
            <Input type="email" placeholder="cto@nova.test" {...form.register("email")} />
            {form.formState.errors.email && <p className="mt-1 text-xs text-rose-300">{form.formState.errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Password</label>
            <Input type="password" {...form.register("password")} />
            {form.formState.errors.password && <p className="mt-1 text-xs text-rose-300">{form.formState.errors.password.message}</p>}
          </div>
          <Button className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in…" : "Continue"}
          </Button>
        </form>
        <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-400">
          <Link href="/forgot-password">Forgot password</Link>
          <span>cto@nova.test / password</span>
        </div>
      </Card>
    </div>
  );
}
