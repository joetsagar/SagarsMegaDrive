-- CreateEnum
CREATE TYPE "folder_category" AS ENUM ('VIDEO', 'PHOTO', 'AUDIO');

-- AlterTable
ALTER TABLE "file" ADD COLUMN     "folderId" TEXT;

-- AlterTable
ALTER TABLE "share_link" ADD COLUMN     "folderId" TEXT,
ALTER COLUMN "fileId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "folder_category" NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "folder_userId_category_parentId_idx" ON "folder"("userId", "category", "parentId");

-- CreateIndex
CREATE INDEX "file_folderId_idx" ON "file"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "share_link_folderId_key" ON "share_link"("folderId");

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_link" ADD CONSTRAINT "share_link_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
