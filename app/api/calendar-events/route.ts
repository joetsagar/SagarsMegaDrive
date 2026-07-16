import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createEventSchema } from "@/features/calendar/lib/schemas";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { title, category, location, description, allDay, startAt, endAt } = parsed.data;

  const event = await db.calendarEvent.create({
    data: {
      title,
      category,
      location: location ?? null,
      description: description ?? null,
      allDay,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      userId: session.user.id,
    },
  });

  return NextResponse.json(event);
}
