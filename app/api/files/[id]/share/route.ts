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
  const file = await db.file.findUnique({ where: { id } });
  if (!file || file.userId !== session.user.id || file.status !== "UPLOADED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await db.shareLink.findFirst({ where: { fileId: id } });
  const isExpired = existing && existing.expiresAt < new Date();

  const shareLink =
    existing && !isExpired
      ? existing
      : await db.shareLink.upsert({
          where: { fileId: id },
          create: { fileId: id, token: generateShareToken(), expiresAt: getShareLinkExpiry() },
          update: { token: generateShareToken(), expiresAt: getShareLinkExpiry() },
        });

  return NextResponse.json({ token: shareLink.token, expiresAt: shareLink.expiresAt });
}
