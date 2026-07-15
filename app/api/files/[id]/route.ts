import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { r2, R2_BUCKET } from "@/lib/r2";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const file = await db.file.findUnique({ where: { id } });
  if (!file || file.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: file.key }));
  } catch {
    return NextResponse.json(
      { error: "Failed to delete file from storage" },
      { status: 500 }
    );
  }

  await db.file.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
