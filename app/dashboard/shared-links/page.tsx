import { headers } from "next/headers";
import { FolderIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/features/files/lib/format";
import { CopyShareLinkButton } from "@/features/files/components/copy-share-link-button";

export default async function SharedLinksPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const shareLinks = await db.shareLink.findMany({
    where: {
      OR: [
        { file: { userId: session!.user.id } },
        { folder: { userId: session!.user.id } },
      ],
    },
    include: { file: true, folder: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared Links</CardTitle>
      </CardHeader>
      <CardContent>
        {shareLinks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No shared links yet. Share a file or folder to create one.
          </p>
        ) : (
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-64" />
              <col className="w-24" />
              <col className="w-44" />
              <col className="w-16" />
            </colgroup>
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Expires</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shareLinks.map((shareLink) => {
                const isExpired = shareLink.expiresAt < new Date();
                const name = shareLink.file?.name ?? shareLink.folder?.name ?? "Unknown";
                return (
                  <tr key={shareLink.id} className="border-b last:border-0">
                    <td className="truncate py-2 pr-4" title={name}>
                      <span className="inline-flex items-center gap-1.5">
                        {shareLink.folder && (
                          <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        {name}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={isExpired ? "outline" : "default"}>
                        {isExpired ? "Expired" : "Active"}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                      {formatDate(shareLink.expiresAt)}
                    </td>
                    <td className="py-2">
                      <div className="flex justify-end">
                        <CopyShareLinkButton token={shareLink.token} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
