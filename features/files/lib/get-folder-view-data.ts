import { db } from "@/lib/db";
import { getFolderBreadcrumbs } from "@/features/files/lib/folder-breadcrumbs";
import { getFileCategory } from "@/features/files/lib/category";

export async function getFolderViewData({
  userId,
  category,
  folderId,
}: {
  userId: string;
  category: "VIDEO" | "PHOTO" | "AUDIO";
  folderId: string | null;
}) {
  let currentFolderId: string | null = null;
  if (folderId) {
    const folder = await db.folder.findUnique({ where: { id: folderId } });
    if (folder && folder.userId === userId && folder.category === category) {
      currentFolderId = folder.id;
    }
  }

  const [breadcrumbs, subfolders, files] = await Promise.all([
    getFolderBreadcrumbs(currentFolderId),
    db.folder.findMany({
      where: { userId, category, parentId: currentFolderId },
      orderBy: { name: "asc" },
    }),
    db.file.findMany({
      where: { userId, status: "UPLOADED", folderId: currentFolderId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const categoryFiles = files.filter((file) => getFileCategory(file) === category);

  return { currentFolderId, breadcrumbs, subfolders, files: categoryFiles };
}
