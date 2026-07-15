"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "credentials" | "totp";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCredentialsSubmit(formData: FormData) {
    setError(null);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const { data, error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message ?? "Invalid email or password.");
        return;
      }

      // better-auth's client types don't surface `twoFactorRedirect` on this
      // call's return, but the two-factor plugin's fetch hook confirms it is
      // present on the raw response at runtime.
      const result = data as typeof data & { twoFactorRedirect?: boolean };
      if (result?.twoFactorRedirect) {
        setStep("totp");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  function handleTotpSubmit(formData: FormData) {
    setError(null);
    const code = String(formData.get("code") ?? "");

    startTransition(async () => {
      const { error: verifyError } = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice: true,
      });

      if (verifyError) {
        setError(verifyError.message ?? "Invalid or expired code.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  if (step === "totp") {
    return (
      <form action={handleTotpSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <ShieldCheck className="size-8 text-accent" />
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">Authentication code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
            className="text-center text-lg tracking-[0.5em]"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending && <Loader2 className="animate-spin" />}
          Verify
        </Button>
        <button
          type="button"
          onClick={() => {
            setStep("credentials");
            setError(null);
          }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form action={handleCredentialsSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
