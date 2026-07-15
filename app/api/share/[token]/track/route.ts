import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRequestIp } from "@/lib/request-ip";
import { getFileShareByToken } from "@/features/files/lib/share";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const shareLink = await getFileShareByToken(token);
  if (!shareLink) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.shareActivity.create({
    data: {
      shareLinkId: shareLink.id,
      type: "PLAY",
      ipAddress: getRequestIp(request.headers),
    },
  });

  return NextResponse.json({ ok: true });
}
