import { Readable } from "node:stream";
import { ZipArchive } from "archiver";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { r2, R2_BUCKET } from "@/lib/r2";
import { getRequestIp } from "@/lib/request-ip";
import { getFolderShareByToken } from "@/features/files/lib/share";

type ZipEntry = { key: string; zipPath: string };

async function collectFiles(folderId: string, pathPrefix: string): Promise<ZipEntry[]> {
  const folder = await db.folder.findUnique({
    where: { id: folderId },
    include: { files: { where: { status: "UPLOADED" } }, children: true },
  });
  if (!folder) return [];

  const files: ZipEntry[] = folder.files.map((file) => ({
    key: file.key,
    zipPath: `${pathPrefix}${file.name}`,
  }));

  const nested = await Promise.all(
    folder.children.map((child) => collectFiles(child.id, `${pathPrefix}${child.name}/`))
  );

  return [...files, ...nested.flat()];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const shareLink = await getFolderShareByToken(token);
  if (!shareLink) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await db.shareActivity.create({
    data: {
      shareLinkId: shareLink.id,
      type: "DOWNLOAD",
      ipAddress: getRequestIp(request.headers),
    },
  });

  const entries = await collectFiles(shareLink.folder.id, "");

  const archive = new ZipArchive({});
  for (const entry of entries) {
    const object = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: entry.key }));
    archive.append(object.Body as Readable, { name: entry.zipPath });
  }
  archive.finalize();

  const encodedName = encodeURIComponent(`${shareLink.folder.name}.zip`);

  return new Response(Readable.toWeb(archive) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${encodedName}"`,
    },
  });
}
