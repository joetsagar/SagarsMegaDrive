"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function UploadButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    startTransition(async () => {
      try {
        const initiateRes = await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            contentType: file.type || "application/octet-stream",
          }),
        });

        if (!initiateRes.ok) {
          const { error } = await initiateRes.json();
          throw new Error(error ?? "Failed to start upload");
        }

        const { fileId, uploadUrl } = await initiateRes.json();

        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });

        if (!putRes.ok) {
          throw new Error("Upload to storage failed");
        }

        const confirmRes = await fetch(`/api/files/${fileId}/confirm`, {
          method: "POST",
        });

        if (!confirmRes.ok) {
          const { error } = await confirmRes.json();
          throw new Error(error ?? "Failed to confirm upload");
        }

        toast.success(`Uploaded ${file.name}`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled={isPending}
      />
      <Button
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Upload />}
        Upload
      </Button>
    </>
  );
}
