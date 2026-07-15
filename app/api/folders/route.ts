import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createFolderSchema } from "@/features/files/lib/folder-schemas";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name, category, parentId } = parsed.data;

  if (parentId) {
    const parent = await db.folder.findUnique({ where: { id: parentId } });
    if (!parent || parent.userId !== session.user.id || parent.category !== category) {
      return NextResponse.json({ error: "Invalid parent folder" }, { status: 400 });
    }
  }

  const folder = await db.folder.create({
    data: { name, category, parentId: parentId ?? null, userId: session.user.id },
  });

  return NextResponse.json(folder);
}
