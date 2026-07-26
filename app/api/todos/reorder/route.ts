import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reorderTodosSchema } from "@/features/todos/lib/schemas";
import { TODO_CATEGORIES, type TodoCategory } from "@/features/todos/lib/categories";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reorderTodosSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const groups = parsed.data;
  const submittedIds = TODO_CATEGORIES.flatMap((category) => groups[category]);

  const owned = await db.todoItem.findMany({
    where: { userId: session.user.id, archived: false },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((t) => t.id));

  const isValid =
    submittedIds.length === ownedIds.size &&
    submittedIds.every((id) => ownedIds.has(id)) &&
    new Set(submittedIds).size === submittedIds.length;

  if (!isValid) {
    return NextResponse.json({ error: "Invalid task list" }, { status: 400 });
  }

  await db.$transaction(
    TODO_CATEGORIES.flatMap((category: TodoCategory) =>
      groups[category].map((id, index) =>
        db.todoItem.update({
          where: { id },
          data: { category, position: index },
        })
      )
    )
  );

  return NextResponse.json({ ok: true });
}
