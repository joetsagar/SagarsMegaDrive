import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useFolderActions() {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareFolder, setShareFolder] = useState<{ id: string; name: string } | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null);

  async function openShare(folder: { id: string; name: string }) {
    setShareFolder(folder);
    setShareUrl(null);
    setShareExpiresAt(null);
    try {
      const res = await fetch(`/api/folders/${folder.id}/share`, { method: "POST" });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to create share link");
      }
      const { token, expiresAt } = await res.json();
      setShareUrl(`${window.location.origin}/share/${token}`);
      setShareExpiresAt(expiresAt);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create share link");
      setShareFolder(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/folders/${pendingDeleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to delete folder");
      }
      toast.success("Folder deleted");
      setPendingDeleteId(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    pendingDeleteId,
    setPendingDeleteId,
    isDeleting,
    confirmDelete,
    shareFolder,
    setShareFolder,
    shareUrl,
    shareExpiresAt,
    openShare,
  };
}

export type FolderActions = ReturnType<typeof useFolderActions>;
