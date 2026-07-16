/*
  Warnings:

  - You are about to drop the column `date` on the `calendar_event` table. All the data in the column will be lost.
  - Added the required column `startAt` to the `calendar_event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `calendar_event` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "event_category" AS ENUM ('WORK', 'TRAVEL', 'PERSONAL');

-- DropIndex
DROP INDEX "calendar_event_userId_date_idx";

-- AlterTable
ALTER TABLE "calendar_event" DROP COLUMN "date",
ADD COLUMN     "allDay" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "category" "event_category" NOT NULL DEFAULT 'PERSONAL',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "startAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "calendar_event_userId_startAt_idx" ON "calendar_event"("userId", "startAt");
