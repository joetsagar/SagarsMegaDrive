import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const meal = await db.meal.findUnique({
    where: { id },
    include: { ingredients: true },
  });
  if (!meal || meal.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (meal.ingredients.length === 0) {
    return NextResponse.json({ added: [] });
  }

  const last = await db.shoppingItem.findFirst({
    where: { userId: session.user.id },
    orderBy: { position: "desc" },
  });
  let nextPosition = last ? last.position + 1 : 0;

  const added = await db.$transaction(
    meal.ingredients.map((ingredient) =>
      db.shoppingItem.create({
        data: {
          title: ingredient.title,
          position: nextPosition++,
          userId: session.user.id,
        },
      })
    )
  );

  return NextResponse.json({ added });
}
