import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { moveFileSchema } from "@/features/files/lib/folder-schemas";
import { getFileCategory } from "@/features/files/lib/category";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const file = await db.file.findUnique({ where: { id } });
  if (!file || file.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = moveFileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { folderId } = parsed.data;

  if (folderId) {
    const folder = await db.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (folder.category !== getFileCategory(file)) {
      return NextResponse.json(
        { error: "File type doesn't match this folder" },
        { status: 400 }
      );
    }
  }

  await db.file.update({ where: { id }, data: { folderId } });

  return NextResponse.json({ ok: true });
}
