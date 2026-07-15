/*
  Warnings:

  - Added the required column `expiresAt` to the `share_link` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "share_link" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;
