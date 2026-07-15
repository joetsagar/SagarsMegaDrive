"use client";

import { Download, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, formatDate } from "@/features/files/lib/format";
import { FileActionDialogs } from "@/features/files/components/file-action-dialogs";
import { useFileActions } from "@/features/files/hooks/use-file-actions";

type FileRow = {
  id: string;
  name: string;
  size: number;
  contentType: string;
  createdAt: Date;
};

export function PhotoGallery({ files }: { files: FileRow[] }) {
  const actions = useFileActions();

  if (files.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No photos uploaded yet.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", file.id)}
            className="group overflow-hidden rounded-lg border"
          >
            <div className="relative aspect-square bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/files/${file.id}/download`}
                alt=""
                className="size-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => actions.openShare({ id: file.id, name: file.name })}
                >
                  <Share2 />
                  <span className="sr-only">Share {file.name}</span>
                </Button>
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
                  onClick={() => actions.setPendingDeleteId(file.id)}
                >
                  <Trash2 />
                  <span className="sr-only">Delete {file.name}</span>
                </Button>
              </div>
            </div>
            <div className="p-2">
              <p className="truncate text-sm" title={file.name}>
                {file.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {formatBytes(file.size)} &middot; {formatDate(file.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <FileActionDialogs {...actions} />
    </>
  );
}
