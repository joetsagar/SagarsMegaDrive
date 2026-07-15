"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyShareLinkButton({ token }: { token: string }) {
  async function copyLink() {
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={copyLink}>
      <Copy />
      <span className="sr-only">Copy share link</span>
    </Button>
  );
}
