"use client";

import { useEffect } from "react";

export function PhotoPreview({
  file,
  onClose,
}: {
  file: { id: string; name: string } | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!file) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [file, onClose]);

  if (!file) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-background/80 p-8 backdrop-blur-xl"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/files/${file.id}/download`}
        alt={file.name}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}
