import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTemplateItemSchema } from "@/features/todos/lib/schemas";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db.todoTemplateItem.findMany({
    where: { userId: session.user.id },
    orderBy: { position: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createTemplateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { title } = parsed.data;

  const last = await db.todoTemplateItem.findFirst({
    where: { userId: session.user.id },
    orderBy: { position: "desc" },
  });

  const item = await db.todoTemplateItem.create({
    data: {
      title,
      position: last ? last.position + 1 : 0,
      userId: session.user.id,
    },
  });

  return NextResponse.json(item);
}
