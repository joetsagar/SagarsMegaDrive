import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { r2, R2_BUCKET } from "@/lib/r2";
import { createUploadSchema } from "@/features/files/lib/schemas";

const UPLOAD_URL_EXPIRY_SECONDS = 300;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const files = await db.file.findMany({
    where: { userId: session.user.id, status: "UPLOADED" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    files.map((file) => ({ ...file, size: Number(file.size) }))
  );
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name, size, contentType } = parsed.data;

  const key = `files/${session.user.id}/${randomUUID()}`;

  const file = await db.file.create({
    data: { key, name, size, contentType, userId: session.user.id, status: "PENDING" },
  });

  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: UPLOAD_URL_EXPIRY_SECONDS }
  );

  return NextResponse.json({ fileId: file.id, uploadUrl });
}
