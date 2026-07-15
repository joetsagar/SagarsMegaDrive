import { db } from "@/lib/db";

export async function getFolderBreadcrumbs(
  folderId: string | null
): Promise<{ id: string; name: string }[]> {
  const crumbs: { id: string; name: string }[] = [];
  let currentId = folderId;

  while (currentId) {
    const folder: { id: string; name: string; parentId: string | null } | null =
      await db.folder.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentId: true },
      });
    if (!folder) break;
    crumbs.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return crumbs;
}
