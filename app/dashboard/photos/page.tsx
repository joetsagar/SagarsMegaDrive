import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { PhotosView } from "@/features/files/components/photos-view";
import { getFolderViewData } from "@/features/files/lib/get-folder-view-data";

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { folderId } = await searchParams;

  const { currentFolderId, breadcrumbs, subfolders, files } = await getFolderViewData({
    userId: session!.user.id,
    category: "PHOTO",
    folderId: folderId ?? null,
  });

  return (
    <PhotosView
      files={files.map((file) => ({ ...file, size: Number(file.size) }))}
      currentFolderId={currentFolderId}
      breadcrumbs={breadcrumbs}
      subfolders={subfolders}
    />
  );
}
