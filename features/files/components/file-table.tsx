"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBytes, formatDate } from "@/features/files/lib/format";

type FileRow = {
  id: string;
  name: string;
  size: number;
  createdAt: Date;
};

export function FileTable({ files }: { files: FileRow[] }) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error ?? "Failed to delete file");
        }
        toast.success("File deleted");
        setPendingDeleteId(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Delete failed");
      }
    });
  }

  if (files.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No files uploaded yet.
      </p>
    );
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Size</th>
            <th className="py-2 font-medium">Uploaded</th>
            <th className="py-2 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id} className="border-b last:border-0">
              <td className="max-w-0 truncate py-2 pr-4">{file.name}</td>
              <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                {formatBytes(file.size)}
              </td>
              <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                {formatDate(file.createdAt)}
              </td>
              <td className="py-2">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={<a href={`/api/files/${file.id}/download`} />}
                  >
                    <Download />
                    <span className="sr-only">Download {file.name}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPendingDeleteId(file.id)}
                  >
                    <Trash2 />
                    <span className="sr-only">Delete {file.name}</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete file?</DialogTitle>
            <DialogDescription>
              This permanently deletes the file from storage. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => pendingDeleteId && handleDelete(pendingDeleteId)}
            >
              {isPending && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
