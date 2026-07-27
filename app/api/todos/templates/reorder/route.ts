import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reorderTemplateItemsSchema } from "@/features/todos/lib/schemas";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reorderTemplateItemsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { orderedIds } = parsed.data;

  const owned = await db.todoTemplateItem.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((i) => i.id));

  const isValid =
    orderedIds.length === ownedIds.size &&
    orderedIds.every((id) => ownedIds.has(id)) &&
    new Set(orderedIds).size === orderedIds.length;

  if (!isValid) {
    return NextResponse.json({ error: "Invalid task list" }, { status: 400 });
  }

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.todoTemplateItem.update({
        where: { id },
        data: { position: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
