"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema } from "@/schemas/auth";
import { forgotPassword } from "@/services/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

export default function ForgotPasswordPage() {
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({ resolver: zodResolver(forgotPasswordSchema) });

  return (
    <div className="mx-auto grid min-h-screen max-w-md place-items-center p-6">
      <Card className="w-full space-y-5">
        <h1 className="text-xl font-semibold">Reset password</h1>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await forgotPassword(values.email);
            toast.success("If that account exists, a reset link was sent.");
          })}
        >
          <Input type="email" placeholder="you@company.com" {...form.register("email")} />
          <Button className="w-full">Send reset link</Button>
        </form>
        <Link className="text-sm text-amber-300" href="/login">
          Back to sign in
        </Link>
      </Card>
    </div>
  );
}
