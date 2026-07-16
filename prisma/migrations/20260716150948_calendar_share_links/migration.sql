-- AlterTable
ALTER TABLE "share_link" ADD COLUMN     "calendarUserId" TEXT;

-- CreateIndex
CREATE INDEX "share_link_calendarUserId_idx" ON "share_link"("calendarUserId");

-- AddForeignKey
ALTER TABLE "share_link" ADD CONSTRAINT "share_link_calendarUserId_fkey" FOREIGN KEY ("calendarUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
