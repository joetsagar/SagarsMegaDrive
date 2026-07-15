import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileTable } from "@/features/files/components/file-table";
import { FolderBrowser } from "@/features/files/components/folder-browser";
import { getFolderViewData } from "@/features/files/lib/get-folder-view-data";

export default async function AudioPage({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { folderId } = await searchParams;

  const { currentFolderId, breadcrumbs, subfolders, files } = await getFolderViewData({
    userId: session!.user.id,
    category: "AUDIO",
    folderId: folderId ?? null,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audio</CardTitle>
      </CardHeader>
      <CardContent>
        <FolderBrowser
          rootLabel="Audio"
          category="AUDIO"
          currentFolderId={currentFolderId}
          breadcrumbs={breadcrumbs}
          subfolders={subfolders}
        >
          <FileTable files={files.map((file) => ({ ...file, size: Number(file.size) }))} />
        </FolderBrowser>
      </CardContent>
    </Card>
  );
}
