"use client";

import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignOut } from "@/features/auth/hooks/use-sign-out";

export function LogoutButton() {
  const { signOut, isPending } = useSignOut();

  return (
    <Button variant="outline" size="sm" onClick={signOut} disabled={isPending}>
      {isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
      Log out
    </Button>
  );
}
