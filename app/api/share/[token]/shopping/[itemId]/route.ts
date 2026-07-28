import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getShoppingShareByToken } from "@/features/files/lib/share";

const toggleSchema = z.object({
  completed: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; itemId: string }> }
) {
  const { token, itemId } = await params;
  const shareLink = await getShoppingShareByToken(token);
  if (!shareLink) {
    return NextResponse.json({ error: "Link not found or expired" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const item = await db.shoppingItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== shareLink.shoppingUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.shoppingItem.update({
    where: { id: itemId },
    data: { completed: parsed.data.completed },
  });

  return NextResponse.json(updated);
}
