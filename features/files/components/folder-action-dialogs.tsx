"use client";

import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/features/files/lib/format";
import type { FolderActions } from "@/features/files/hooks/use-folder-actions";

export function FolderActionDialogs(actions: FolderActions) {
  const [copied, setCopied] = useState(false);

  async function copyShareUrl() {
    if (!actions.shareUrl) return;
    await navigator.clipboard.writeText(actions.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Dialog
        open={actions.pendingDeleteId !== null}
        onOpenChange={(open) => !open && actions.setPendingDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete folder?</DialogTitle>
            <DialogDescription>
              This deletes the folder and any subfolders. Files inside aren&apos;t
              deleted — they become unfiled and stay in the main list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              disabled={actions.isDeleting}
              onClick={actions.confirmDelete}
            >
              {actions.isDeleting && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={actions.shareFolder !== null}
        onOpenChange={(open) => !open && actions.setShareFolder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share {actions.shareFolder?.name}</DialogTitle>
            <DialogDescription>
              Anyone with this link can download this folder&apos;s contents as a
              .zip — no sign-in or access to the rest of your drive. Views and
              downloads (with IP address) are logged in Activity. The link
              expires 72 hours after it&apos;s created.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input value={actions.shareUrl ?? "Generating link..."} readOnly />
            <Button
              variant="outline"
              size="icon"
              onClick={copyShareUrl}
              disabled={!actions.shareUrl}
            >
              {copied ? <Check /> : <Copy />}
              <span className="sr-only">Copy link</span>
            </Button>
          </div>
          {actions.shareExpiresAt && (
            <p className="text-xs text-muted-foreground">
              Expires {formatDate(new Date(actions.shareExpiresAt))}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
