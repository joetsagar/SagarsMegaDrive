import { headers } from "next/headers";
import Image from "next/image";
import { Download, FolderIcon } from "lucide-react";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getRequestIp } from "@/lib/request-ip";
import { getShareLinkByToken } from "@/features/files/lib/share";
import { formatBytes, formatDate } from "@/features/files/lib/format";
import { ShareAudioPlayer } from "@/features/files/components/share-audio-player";
import { CalendarView } from "@/features/calendar/components/calendar-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shareLink = await getShareLinkByToken(token);
  const isValidFile = shareLink?.file && shareLink.file.status === "UPLOADED";
  const isValidFolder = shareLink?.folder;
  const isValidCalendar = shareLink?.calendarUser;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-0 p-4">
      <Image
        src="/logo.png"
        alt="SagarsMegaDrive"
        width={960}
        height={960}
        priority
        className="h-auto w-[32rem] max-w-[90vw]"
      />

      <Card className={cn("w-full", isValidCalendar ? "max-w-3xl" : "max-w-md")}>
        {isValidFile ? (
          <SharedFile token={token} file={shareLink!.file!} shareLinkId={shareLink!.id} />
        ) : isValidFolder ? (
          <SharedFolder token={token} folder={shareLink!.folder!} shareLinkId={shareLink!.id} />
        ) : isValidCalendar ? (
          <SharedCalendar
            calendarUserId={shareLink!.calendarUser!.id}
            shareLinkId={shareLink!.id}
            isPrivate={shareLink!.isPrivate}
          />
        ) : (
          <CardHeader className="text-center">
            <CardTitle>Link not found</CardTitle>
            <CardDescription>
              This share link is invalid or the content is no longer available.
            </CardDescription>
          </CardHeader>
        )}
      </Card>
    </div>
  );
}

async function logView(shareLinkId: string) {
  const requestHeaders = await headers();
  await db.shareActivity.create({
    data: {
      shareLinkId,
      type: "VIEW",
      ipAddress: getRequestIp(requestHeaders),
    },
  });
}

async function SharedFile({
  token,
  file,
  shareLinkId,
}: {
  token: string;
  file: { name: string; size: bigint; contentType: string; createdAt: Date };
  shareLinkId: string;
}) {
  await logView(shareLinkId);

  const isAudio = file.contentType.startsWith("audio/");

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="truncate">{file.name}</CardTitle>
        <CardDescription>
          {formatBytes(Number(file.size))} &middot; Shared {formatDate(file.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isAudio && <ShareAudioPlayer token={token} />}
        <Button render={<a href={`/api/share/${token}/download`} />}>
          <Download />
          Download
        </Button>
      </CardContent>
    </>
  );
}

async function SharedFolder({
  token,
  folder,
  shareLinkId,
}: {
  token: string;
  folder: { name: string; createdAt: Date };
  shareLinkId: string;
}) {
  await logView(shareLinkId);

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 truncate">
          <FolderIcon className="size-5 shrink-0 text-muted-foreground" />
          {folder.name}
        </CardTitle>
        <CardDescription>Shared folder &middot; {formatDate(folder.createdAt)}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button render={<a href={`/api/share/${token}/zip`} />}>
          <Download />
          Download all as .zip
        </Button>
      </CardContent>
    </>
  );
}

async function SharedCalendar({
  calendarUserId,
  shareLinkId,
  isPrivate,
}: {
  calendarUserId: string;
  shareLinkId: string;
  isPrivate: boolean;
}) {
  await logView(shareLinkId);

  const events = await db.calendarEvent.findMany({
    where: { userId: calendarUserId },
    orderBy: { startAt: "asc" },
  });

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle>Shared Calendar</CardTitle>
        <CardDescription>
          {isPrivate
            ? "View only — events show as “Busy” without any details."
            : "View only — events can't be added or changed here."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CalendarView events={events} readOnly privacyMode={isPrivate} />
      </CardContent>
    </>
  );
}
