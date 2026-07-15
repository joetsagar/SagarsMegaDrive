"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CardAction } from "@/components/ui/card";
import { uploadFile } from "@/features/files/lib/upload";

export function UploadButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isUploading = progress !== null;

  useEffect(() => {
    if (!isUploading) return;
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isUploading]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    startTransition(async () => {
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      setProgress(0);
      try {
        await uploadFile(file, setProgress);
        toast.success(`Uploaded ${file.name}`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setProgress(null);
        startTimeRef.current = null;
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
      {isUploading ? (
        <div className="flex flex-col gap-1">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{elapsedSeconds}s</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
        </div>
      ) : (
        <CardAction>
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={isPending}>
            <Upload />
            Upload
          </Button>
        </CardAction>
      )}
    </>
  );
}
