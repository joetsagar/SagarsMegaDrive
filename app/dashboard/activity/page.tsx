import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/features/files/lib/format";

const EVENT_LABELS = { VIEW: "Viewed", PLAY: "Played", DOWNLOAD: "Downloaded" } as const;
const EVENT_VARIANTS = {
  VIEW: "outline",
  PLAY: "default",
  DOWNLOAD: "secondary",
} as const;

export default async function ActivityPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const activity = await db.shareActivity.findMany({
    where: {
      shareLink: {
        OR: [
          { file: { userId: session!.user.id } },
          { folder: { userId: session!.user.id } },
          { calendarUserId: session!.user.id },
        ],
      },
    },
    include: { shareLink: { include: { file: true, folder: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No activity yet. Share a file, folder, or your calendar to start seeing views, plays, and downloads here.
          </p>
        ) : (
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col />
              <col className="w-28" />
              <col className="w-32" />
              <col className="w-44" />
            </colgroup>
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Event</th>
                <th className="py-2 pr-4 font-medium">IP address</th>
                <th className="py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((entry) => {
                const name =
                  entry.shareLink.file?.name ??
                  entry.shareLink.folder?.name ??
                  (entry.shareLink.calendarUserId ? "Calendar" : "Unknown");
                return (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="truncate py-2 pr-4">{name}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={EVENT_VARIANTS[entry.type]}>
                        {EVENT_LABELS[entry.type]}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                      {entry.ipAddress ?? "Unknown"}
                    </td>
                    <td className="py-2 whitespace-nowrap text-muted-foreground">
                      {formatDate(entry.createdAt)}
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
