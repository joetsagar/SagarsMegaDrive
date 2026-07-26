import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateShareToken } from "@/lib/tokens";
import { getShareLinkExpiry } from "@/features/files/lib/share";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shareLink = await db.shareLink.create({
    data: {
      shoppingUserId: session.user.id,
      token: generateShareToken(),
      expiresAt: getShareLinkExpiry(),
    },
  });

  return NextResponse.json({ token: shareLink.token, expiresAt: shareLink.expiresAt });
}
