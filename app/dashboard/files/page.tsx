import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadButton } from "@/features/files/components/upload-button";
import { FileTable } from "@/features/files/components/file-table";

export default async function FilesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const files = await db.file.findMany({
    where: { userId: session!.user.id, status: "UPLOADED" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Files</CardTitle>
        <CardAction>
          <UploadButton />
        </CardAction>
      </CardHeader>
      <CardContent>
        <FileTable
          files={files.map((file) => ({ ...file, size: Number(file.size) }))}
        />
      </CardContent>
    </Card>
  );
}
