import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reorderShoppingItemsSchema } from "@/features/shopping/lib/schemas";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reorderShoppingItemsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { orderedIds } = parsed.data;

  const owned = await db.shoppingItem.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((s) => s.id));

  const isValid =
    orderedIds.length === ownedIds.size &&
    orderedIds.every((id) => ownedIds.has(id)) &&
    new Set(orderedIds).size === orderedIds.length;

  if (!isValid) {
    return NextResponse.json({ error: "Invalid shopping list" }, { status: 400 });
  }

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.shoppingItem.update({
        where: { id },
        data: { position: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
