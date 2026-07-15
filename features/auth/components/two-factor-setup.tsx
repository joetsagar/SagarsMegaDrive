"use client";

import { useState, useTransition } from "react";
import QRCode from "qrcode";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Stage = "idle" | "password" | "scan" | "confirm";

export function TwoFactorSetup({ initiallyEnabled }: { initiallyEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [stage, setStage] = useState<Stage>("idle");
  const [isPending, startTransition] = useTransition();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleEnableStart(formData: FormData) {
    setError(null);
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const { data, error: enableError } = await authClient.twoFactor.enable({
        password,
        issuer: "SagarsMegaDrive",
      });

      if (enableError) {
        setError(enableError.message ?? "Could not start 2FA setup.");
        return;
      }

      if (data?.totpURI) {
        const dataUrl = await QRCode.toDataURL(data.totpURI);
        setQrDataUrl(dataUrl);
      }
      setBackupCodes(data?.backupCodes ?? null);
      setStage("scan");
    });
  }

  function handleConfirm(formData: FormData) {
    setError(null);
    const code = String(formData.get("code") ?? "");

    startTransition(async () => {
      const { error: verifyError } = await authClient.twoFactor.verifyTotp({
        code,
      });

      if (verifyError) {
        setError(verifyError.message ?? "Invalid code. Try again.");
        return;
      }

      setEnabled(true);
      setStage("idle");
      setQrDataUrl(null);
      toast.success("Two-factor authentication enabled.");
    });
  }

  function handleDisable(formData: FormData) {
    setError(null);
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const { error: disableError } = await authClient.twoFactor.disable({
        password,
      });

      if (disableError) {
        setError(disableError.message ?? "Could not disable 2FA.");
        return;
      }

      setEnabled(false);
      setStage("idle");
      toast.success("Two-factor authentication disabled.");
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {enabled ? (
          <ShieldCheck className="size-5 text-accent" />
        ) : (
          <ShieldOff className="size-5 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">
            {enabled ? "Two-factor authentication is enabled" : "Two-factor authentication is off"}
          </p>
          <p className="text-sm text-muted-foreground">
            Require an authenticator app code at sign-in.
          </p>
        </div>
      </div>

      {enabled ? (
        <Dialog open={stage === "password"} onOpenChange={(open) => setStage(open ? "password" : "idle")}>
          <Button variant="outline" onClick={() => setStage("password")}>
            Disable
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disable two-factor authentication</DialogTitle>
              <DialogDescription>Confirm your password to disable 2FA.</DialogDescription>
            </DialogHeader>
            <form action={handleDisable} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="disable-password">Password</Label>
                <Input id="disable-password" name="password" type="password" required autoFocus />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                Disable 2FA
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      ) : (
        <Dialog
          open={stage !== "idle"}
          onOpenChange={(open) => {
            if (!open) {
              setStage("idle");
              setError(null);
            }
          }}
        >
          <Button onClick={() => setStage("password")}>Enable</Button>
          <DialogContent>
            {stage === "password" && (
              <>
                <DialogHeader>
                  <DialogTitle>Enable two-factor authentication</DialogTitle>
                  <DialogDescription>Confirm your password to begin setup.</DialogDescription>
                </DialogHeader>
                <form action={handleEnableStart} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="enable-password">Password</Label>
                    <Input id="enable-password" name="password" type="password" required autoFocus />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="animate-spin" />}
                    Continue
                  </Button>
                </form>
              </>
            )}

            {stage === "scan" && (
              <>
                <DialogHeader>
                  <DialogTitle>Scan this QR code</DialogTitle>
                  <DialogDescription>
                    Scan with an authenticator app, then enter the code it generates.
                    Save these backup codes somewhere safe — each can be used once if you lose your device.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4">
                  {qrDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="TOTP QR code" className="size-48 rounded-md" />
                  )}
                  {backupCodes && (
                    <div className="grid w-full grid-cols-2 gap-1 rounded-md bg-muted p-3 font-mono text-xs">
                      {backupCodes.map((code) => (
                        <span key={code}>{code}</span>
                      ))}
                    </div>
                  )}
                </div>
                <form action={handleConfirm} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="confirm-code">Authentication code</Label>
                    <Input
                      id="confirm-code"
                      name="code"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      autoFocus
                      className="text-center tracking-[0.5em]"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="animate-spin" />}
                    Confirm & enable
                  </Button>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
