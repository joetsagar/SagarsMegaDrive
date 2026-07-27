import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templateItems = await db.todoTemplateItem.findMany({
    where: { userId: session.user.id },
    orderBy: { position: "asc" },
  });

  if (templateItems.length === 0) {
    return NextResponse.json({ added: [] });
  }

  const [lastInCategory, lastCombined] = await Promise.all([
    db.todoItem.findFirst({
      where: { userId: session.user.id, category: "WORK" },
      orderBy: { position: "desc" },
    }),
    db.todoItem.findFirst({
      where: { userId: session.user.id },
      orderBy: { combinedPosition: "desc" },
    }),
  ]);

  let nextPosition = lastInCategory ? lastInCategory.position + 1 : 0;
  let nextCombinedPosition = lastCombined ? lastCombined.combinedPosition + 1 : 0;

  const added = await db.$transaction(
    templateItems.map((template) =>
      db.todoItem.create({
        data: {
          title: template.title,
          category: "WORK",
          position: nextPosition++,
          combinedPosition: nextCombinedPosition++,
          userId: session.user.id,
        },
      })
    )
  );

  return NextResponse.json({ added });
}
