import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@/lib/db";
import { r2, R2_BUCKET } from "@/lib/r2";
import { getRequestIp } from "@/lib/request-ip";
import { getFileShareByToken } from "@/features/files/lib/share";

const DOWNLOAD_URL_EXPIRY_SECONDS = 60;

export async function GET(
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
      type: "DOWNLOAD",
      ipAddress: getRequestIp(request.headers),
    },
  });

  const encodedName = encodeURIComponent(shareLink.file.name);
  const downloadUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: shareLink.file.key,
      ResponseContentDisposition: `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
    }),
    { expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS }
  );

  return NextResponse.redirect(downloadUrl);
}
