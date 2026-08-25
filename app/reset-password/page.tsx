"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/services/auth";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  return (
    <Card className="w-full max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Choose a new password</h1>
      <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Input type="password" placeholder="Confirm password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />
      <Button
        className="w-full"
        onClick={async () => {
          await resetPassword({
            email: params.get("email") ?? "",
            token: params.get("token") ?? "",
            password,
            password_confirmation: passwordConfirmation,
          });
          toast.success("Password updated");
          router.push("/login");
        }}
      >
        Update password
      </Button>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>
  );
}
