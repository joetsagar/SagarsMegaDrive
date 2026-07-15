"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileTable } from "@/features/files/components/file-table";
import { PhotoGallery } from "@/features/files/components/photo-gallery";
import { FolderBrowser } from "@/features/files/components/folder-browser";

type FileRow = {
  id: string;
  name: string;
  size: number;
  contentType: string;
  createdAt: Date;
};

type FolderSummary = { id: string; name: string };

export function PhotosView({
  files,
  currentFolderId,
  breadcrumbs,
  subfolders,
}: {
  files: FileRow[];
  currentFolderId: string | null;
  breadcrumbs: FolderSummary[];
  subfolders: FolderSummary[];
}) {
  const [view, setView] = useState<"list" | "gallery">("gallery");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos</CardTitle>
        <CardAction className="flex gap-1">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("list")}
          >
            <List />
            <span className="sr-only">List view</span>
          </Button>
          <Button
            variant={view === "gallery" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("gallery")}
          >
            <LayoutGrid />
            <span className="sr-only">Gallery view</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <FolderBrowser
          rootLabel="Photos"
          category="PHOTO"
          currentFolderId={currentFolderId}
          breadcrumbs={breadcrumbs}
          subfolders={subfolders}
        >
          {view === "list" ? <FileTable files={files} /> : <PhotoGallery files={files} />}
        </FolderBrowser>
      </CardContent>
    </Card>
  );
}
