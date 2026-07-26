"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronRight, FolderIcon, FolderPlus, Loader2, Share2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { FolderActionDialogs } from "@/features/files/components/folder-action-dialogs";
import { useFolderActions } from "@/features/files/hooks/use-folder-actions";

type FolderSummary = { id: string; name: string };
type Category = "VIDEO" | "PHOTO" | "AUDIO";

export function FolderBrowser({
  rootLabel,
  category,
  currentFolderId,
  breadcrumbs,
  subfolders,
  children,
}: {
  rootLabel: string;
  category: Category;
  currentFolderId: string | null;
  breadcrumbs: FolderSummary[];
  subfolders: FolderSummary[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const actions = useFolderActions();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [draggingOverId, setDraggingOverId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
      prev.size === subfolders.length ? new Set() : new Set(subfolders.map((f) => f.id))
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
        Array.from(selectedIds).map((id) => fetch(`/api/folders/${id}`, { method: "DELETE" }))
      );
      if (results.some((res) => !res.ok)) throw new Error();
      toast.success(`Deleted ${selectedIds.size} folder${selectedIds.size === 1 ? "" : "s"}`);
      setIsBulkDeleteOpen(false);
      exitSelectMode();
      router.refresh();
    } catch {
      toast.error("Failed to delete some folders");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function navigateTo(folderId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (folderId) {
      params.set("folderId", folderId);
    } else {
      params.delete("folderId");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          category,
          parentId: currentFolderId,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to create folder");
      }
      setIsCreateOpen(false);
      setNewFolderName("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create folder");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDrop(targetFolderId: string | null, event: React.DragEvent) {
    event.preventDefault();
    setDraggingOverId(null);
    const fileId = event.dataTransfer.getData("text/plain");
    if (!fileId) return;
    try {
      const res = await fetch(`/api/files/${fileId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: targetFolderId }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to move file");
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to move file");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <nav className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          <button
            onClick={() => navigateTo(null)}
            onDragOver={(e) => {
              e.preventDefault();
              setDraggingOverId("root");
            }}
            onDragLeave={() => setDraggingOverId(null)}
            onDrop={(e) => handleDrop(null, e)}
            className={cn(
              "shrink-0 rounded px-1 hover:text-foreground",
              currentFolderId === null && "text-foreground",
              draggingOverId === "root" && "bg-primary/10 text-primary"
            )}
          >
            {rootLabel}
          </button>
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.id} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="size-3.5 shrink-0" />
              <button
                onClick={() => navigateTo(crumb.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDraggingOverId(crumb.id);
                }}
                onDragLeave={() => setDraggingOverId(null)}
                onDrop={(e) => handleDrop(crumb.id, e)}
                className={cn(
                  "truncate rounded px-1 hover:text-foreground",
                  index === breadcrumbs.length - 1 && "text-foreground",
                  draggingOverId === crumb.id && "bg-primary/10 text-primary"
                )}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </nav>
        <Button size="sm" variant="outline" onClick={() => setIsCreateOpen(true)}>
          <FolderPlus />
          New Folder
        </Button>
      </div>

      {subfolders.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-2">
            {selectMode ? (
              <>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === subfolders.length}
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

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {subfolders.map((folder) => {
              const isSelected = selectedIds.has(folder.id);
              return (
                <div
                  key={folder.id}
                  onClick={() => (selectMode ? toggleSelected(folder.id) : navigateTo(folder.id))}
                  onDragOver={(e) => {
                    if (selectMode) return;
                    e.preventDefault();
                    setDraggingOverId(folder.id);
                  }}
                  onDragLeave={() => setDraggingOverId(null)}
                  onDrop={(e) => !selectMode && handleDrop(folder.id, e)}
                  className={cn(
                    "group relative flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : draggingOverId === folder.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                  )}
                >
                  {selectMode ? (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelected(folder.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-1 left-1 size-4"
                    />
                  ) : (
                    <div
                      className="absolute top-1 right-1 hidden gap-0.5 group-hover:flex"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => actions.openShare({ id: folder.id, name: folder.name })}
                      >
                        <Share2 />
                        <span className="sr-only">Share {folder.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => actions.setPendingDeleteId(folder.id)}
                      >
                        <Trash2 />
                        <span className="sr-only">Delete {folder.name}</span>
                      </Button>
                    </div>
                  )}
                  <FolderIcon className="size-8 text-muted-foreground" />
                  <span className="w-full truncate text-xs" title={folder.name}>
                    {folder.name}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {children}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Create a folder here. You can drag files into it once it&apos;s created.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
            autoFocus
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={createFolder} disabled={isCreating || !newFolderName.trim()}>
              {isCreating && <Loader2 className="animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FolderActionDialogs {...actions} />

      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {selectedIds.size} folder{selectedIds.size === 1 ? "" : "s"}?
            </DialogTitle>
            <DialogDescription>
              This permanently deletes the selected folders and everything inside them. This
              can&apos;t be undone.
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
    </div>
  );
}
