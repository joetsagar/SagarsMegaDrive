import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { r2, R2_BUCKET } from "@/lib/r2";

const DOWNLOAD_URL_EXPIRY_SECONDS = 60;

export async function GET(
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

  const encodedName = encodeURIComponent(file.name);
  const downloadUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: file.key,
      ResponseContentDisposition: `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
    }),
    { expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS }
  );

  return NextResponse.redirect(downloadUrl);
}
