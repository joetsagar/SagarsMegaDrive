-- DropIndex
DROP INDEX "share_link_fileId_key";

-- DropIndex
DROP INDEX "share_link_folderId_key";

-- CreateIndex
CREATE INDEX "share_link_fileId_idx" ON "share_link"("fileId");

-- CreateIndex
CREATE INDEX "share_link_folderId_idx" ON "share_link"("folderId");
