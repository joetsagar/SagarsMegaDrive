"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/features/files/lib/upload";

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressText, setProgressText] = useState("");

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;
    setIsUploading(true);

    let succeeded = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgressText(
        files.length > 1 ? `Uploading ${i + 1} of ${files.length}…` : `Uploading ${file.name}…`
      );
      try {
        await uploadFile(file);
        succeeded++;
      } catch (error) {
        toast.error(
          `${file.name}: ${error instanceof Error ? error.message : "Upload failed"}`
        );
      }
    }

    if (succeeded > 0) {
      toast.success(succeeded === 1 ? "File uploaded" : `${succeeded} files uploaded`);
      router.refresh();
    }

    setIsUploading(false);
    setProgressText("");
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    uploadFiles(Array.from(event.dataTransfer.files));
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    uploadFiles(files);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isUploading && inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {isUploading ? (
        <>
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{progressText}</p>
        </>
      ) : (
        <>
          <UploadCloud className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag and drop files here, or click to browse
          </p>
        </>
      )}
    </div>
  );
}
