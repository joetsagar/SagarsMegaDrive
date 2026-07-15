-- DropIndex
DROP INDEX "share_link_fileId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "share_link_fileId_key" ON "share_link"("fileId");
