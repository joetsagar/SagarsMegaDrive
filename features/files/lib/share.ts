import { db } from "@/lib/db";

export const SHARE_LINK_TTL_MS = 72 * 60 * 60 * 1000;

export function getShareLinkExpiry(): Date {
  return new Date(Date.now() + SHARE_LINK_TTL_MS);
}

export async function getShareLinkByToken(token: string) {
  const shareLink = await db.shareLink.findUnique({
    where: { token },
    include: { file: true, folder: true, calendarUser: true },
  });

  if (!shareLink || shareLink.expiresAt < new Date()) {
    return null;
  }

  return shareLink;
}

export async function getFileShareByToken(token: string) {
  const shareLink = await getShareLinkByToken(token);
  if (!shareLink || !shareLink.file || shareLink.file.status !== "UPLOADED") {
    return null;
  }
  return { ...shareLink, file: shareLink.file };
}

export async function getFolderShareByToken(token: string) {
  const shareLink = await getShareLinkByToken(token);
  if (!shareLink || !shareLink.folder) {
    return null;
  }
  return { ...shareLink, folder: shareLink.folder };
}

export async function getCalendarShareByToken(token: string) {
  const shareLink = await getShareLinkByToken(token);
  if (!shareLink || !shareLink.calendarUser) {
    return null;
  }
  return { ...shareLink, calendarUser: shareLink.calendarUser };
}
