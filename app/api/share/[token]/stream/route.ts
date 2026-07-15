import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { getFileShareByToken } from "@/features/files/lib/share";

const STREAM_URL_EXPIRY_SECONDS = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const shareLink = await getFileShareByToken(token);
  if (!shareLink) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const streamUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: shareLink.file.key }),
    { expiresIn: STREAM_URL_EXPIRY_SECONDS }
  );

  return NextResponse.redirect(streamUrl);
}
