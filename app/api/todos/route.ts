import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTodoSchema } from "@/features/todos/lib/schemas";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todos = await db.todoItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ category: "asc" }, { position: "asc" }],
  });

  return NextResponse.json(todos);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createTodoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { title, category } = parsed.data;

  const last = await db.todoItem.findFirst({
    where: { userId: session.user.id, category },
    orderBy: { position: "desc" },
  });

  const todo = await db.todoItem.create({
    data: {
      title,
      category,
      position: last ? last.position + 1 : 0,
      userId: session.user.id,
    },
  });

  return NextResponse.json(todo);
}
