"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Pause, Play, Share2, Trash2, X } from "lucide-react";
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
import { AudioPlayer } from "@/features/files/components/audio-player";
import { FileActionDialogs } from "@/features/files/components/file-action-dialogs";
import { PhotoPreview } from "@/features/files/components/photo-preview";
import { useFileActions } from "@/features/files/hooks/use-file-actions";

type FileRow = {
  id: string;
  name: string;
  size: number;
  contentType: string;
  createdAt: Date;
  originalCreatedAt: Date | null;
};

export function FileTable({ files }: { files: FileRow[] }) {
  const router = useRouter();
  const actions = useFileActions();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string } | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  if (files.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No files uploaded yet.
      </p>
    );
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === files.length ? new Set() : new Set(files.map((f) => f.id))
    );
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  async function confirmBulkDelete() {
    setIsBulkDeleting(true);
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map((id) => fetch(`/api/files/${id}`, { method: "DELETE" }))
      );
      if (results.some((res) => !res.ok)) throw new Error();
      toast.success(`Deleted ${selectedIds.size} file${selectedIds.size === 1 ? "" : "s"}`);
      setIsBulkDeleteOpen(false);
      exitSelectMode();
      router.refresh();
    } catch {
      toast.error("Failed to delete some files");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        {selectMode ? (
          <>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={selectedIds.size === files.length}
                onChange={toggleSelectAll}
                className="size-4"
              />
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedIds.size === 0}
                onClick={() => setIsBulkDeleteOpen(true)}
              >
                <Trash2 />
                Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
              </Button>
              <Button variant="ghost" size="sm" onClick={exitSelectMode}>
                <X />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => setSelectMode(true)}
          >
            Select
          </Button>
        )}
      </div>

      <table className="w-full table-fixed text-sm">
        <colgroup>
          {selectMode && <col className="w-8" />}
          <col className="w-64" />
          <col className="w-20" />
          <col className="w-32" />
          <col className="w-28" />
        </colgroup>
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            {selectMode && (
              <th className="py-2 pr-2">
                <span className="sr-only">Selected</span>
              </th>
            )}
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 pl-4 font-medium">Size</th>
            <th className="py-2 pr-4 font-medium">Created</th>
            <th className="py-2 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const isAudio = file.contentType.startsWith("audio/");
            const isPhoto = file.contentType.startsWith("image/");
            const isExpanded = expandedId === file.id;
            const isPlaying = isExpanded && playingId === file.id;
            const isSelected = selectedIds.has(file.id);

            function togglePlayback() {
              if (isExpanded) {
                setExpandedId(null);
                setPlayingId(null);
              } else {
                setExpandedId(file.id);
              }
            }

            return (
              <Fragment key={file.id}>
                <tr
                  draggable={!selectMode}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", file.id)}
                  onClick={() => selectMode && toggleSelected(file.id)}
                  className={`border-b last:border-0 ${selectMode ? "cursor-pointer" : ""} ${isSelected ? "bg-primary/5" : ""}`}
                >
                  {selectMode && (
                    <td className="py-2 pr-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(file.id)}
                        className="size-4"
                      />
                    </td>
                  )}
                  <td className="py-2 pr-4">
                    <div
                      className={`flex min-w-0 items-center gap-2 ${isPhoto && !selectMode ? "cursor-zoom-in" : ""}`}
                      onClick={(e) => {
                        if (selectMode) return;
                        if (isPhoto) {
                          e.stopPropagation();
                          setPreviewFile({ id: file.id, name: file.name });
                        }
                      }}
                    >
                      {isAudio && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlayback();
                          }}
                        >
                          {isPlaying ? <Pause /> : <Play />}
                          <span className="sr-only">
                            {isPlaying ? "Pause" : "Play"} {file.name}
                          </span>
                        </Button>
                      )}
                      {isPhoto && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/files/${file.id}/download`}
                          alt=""
                          className="size-8 shrink-0 rounded object-cover"
                        />
                      )}
                      <span className="truncate" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 pl-4 whitespace-nowrap text-muted-foreground">
                    {formatBytes(file.size)}
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                    {formatDate(file.originalCreatedAt ?? file.createdAt)}
                  </td>
                  <td className="py-2">
                    {!selectMode && (
                      <div className="flex justify-end gap-1">
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
                    )}
                  </td>
                </tr>
                {isAudio && isExpanded && (
                  <tr className="border-b last:border-0">
                    <td colSpan={selectMode ? 5 : 4} className="pb-3">
                      <AudioPlayer
                        src={`/api/files/${file.id}/download`}
                        autoPlay
                        onPlayStateChange={(playing) => setPlayingId(playing ? file.id : null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      <FileActionDialogs {...actions} />
      <PhotoPreview file={previewFile} onClose={() => setPreviewFile(null)} />

      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} file{selectedIds.size === 1 ? "" : "s"}?</DialogTitle>
            <DialogDescription>
              This permanently deletes the selected files from storage. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={isBulkDeleting} onClick={confirmBulkDelete}>
              {isBulkDeleting && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
