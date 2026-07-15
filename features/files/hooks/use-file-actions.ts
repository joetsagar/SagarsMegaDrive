import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useFileActions() {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareFile, setShareFile] = useState<{ id: string; name: string } | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null);

  async function openShare(file: { id: string; name: string }) {
    setShareFile(file);
    setShareUrl(null);
    setShareExpiresAt(null);
    try {
      const res = await fetch(`/api/files/${file.id}/share`, { method: "POST" });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to create share link");
      }
      const { token, expiresAt } = await res.json();
      setShareUrl(`${window.location.origin}/share/${token}`);
      setShareExpiresAt(expiresAt);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create share link");
      setShareFile(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/files/${pendingDeleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to delete file");
      }
      toast.success("File deleted");
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
    shareFile,
    setShareFile,
    shareUrl,
    shareExpiresAt,
    openShare,
  };
}

export type FileActions = ReturnType<typeof useFileActions>;
