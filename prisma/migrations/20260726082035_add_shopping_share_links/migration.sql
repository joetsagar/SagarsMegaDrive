-- AlterTable
ALTER TABLE "share_link" ADD COLUMN     "shoppingUserId" TEXT;

-- CreateIndex
CREATE INDEX "share_link_shoppingUserId_idx" ON "share_link"("shoppingUserId");

-- AddForeignKey
ALTER TABLE "share_link" ADD CONSTRAINT "share_link_shoppingUserId_fkey" FOREIGN KEY ("shoppingUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
