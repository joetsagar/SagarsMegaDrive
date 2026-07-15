import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileTable } from "@/features/files/components/file-table";
import { getFileCategory } from "@/features/files/lib/category";

export default async function OtherPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const files = await db.file.findMany({
    where: { userId: session!.user.id, status: "UPLOADED" },
    orderBy: { createdAt: "desc" },
  });

  const other = files.filter((file) => getFileCategory(file) === "OTHER");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Other</CardTitle>
      </CardHeader>
      <CardContent>
        <FileTable files={other.map((file) => ({ ...file, size: Number(file.size) }))} />
      </CardContent>
    </Card>
  );
}
