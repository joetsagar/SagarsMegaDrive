-- CreateEnum
CREATE TYPE "share_activity_type" AS ENUM ('VIEW', 'PLAY', 'DOWNLOAD');

-- CreateTable
CREATE TABLE "share_link" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_activity" (
    "id" TEXT NOT NULL,
    "shareLinkId" TEXT NOT NULL,
    "type" "share_activity_type" NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "share_link_token_key" ON "share_link"("token");

-- CreateIndex
CREATE INDEX "share_link_fileId_idx" ON "share_link"("fileId");

-- CreateIndex
CREATE INDEX "share_activity_shareLinkId_createdAt_idx" ON "share_activity"("shareLinkId", "createdAt");

-- AddForeignKey
ALTER TABLE "share_link" ADD CONSTRAINT "share_link_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_activity" ADD CONSTRAINT "share_activity_shareLinkId_fkey" FOREIGN KEY ("shareLinkId") REFERENCES "share_link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
