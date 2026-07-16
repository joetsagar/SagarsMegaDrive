import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateShareToken } from "@/lib/tokens";
import { getShareLinkExpiry } from "@/features/files/lib/share";

const shareCalendarSchema = z.object({
  isPrivate: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = shareCalendarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const shareLink = await db.shareLink.create({
    data: {
      calendarUserId: session.user.id,
      isPrivate: parsed.data.isPrivate,
      token: generateShareToken(),
      expiresAt: getShareLinkExpiry(),
    },
  });

  return NextResponse.json({ token: shareLink.token, expiresAt: shareLink.expiresAt });
}
