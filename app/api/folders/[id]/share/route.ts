import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateShareToken } from "@/lib/tokens";
import { getShareLinkExpiry } from "@/features/files/lib/share";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const folder = await db.folder.findUnique({ where: { id } });
  if (!folder || folder.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await db.shareLink.findFirst({ where: { folderId: id } });
  const isExpired = existing && existing.expiresAt < new Date();

  const shareLink =
    existing && !isExpired
      ? existing
      : await db.shareLink.upsert({
          where: { folderId: id },
          create: { folderId: id, token: generateShareToken(), expiresAt: getShareLinkExpiry() },
          update: { token: generateShareToken(), expiresAt: getShareLinkExpiry() },
        });

  return NextResponse.json({ token: shareLink.token, expiresAt: shareLink.expiresAt });
}
