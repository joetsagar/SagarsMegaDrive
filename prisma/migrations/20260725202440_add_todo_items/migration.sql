-- CreateEnum
CREATE TYPE "todo_category" AS ENUM ('HOME', 'WORK');

-- CreateTable
CREATE TABLE "todo_item" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "todo_category" NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todo_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "todo_item_userId_category_position_idx" ON "todo_item"("userId", "category", "position");

-- AddForeignKey
ALTER TABLE "todo_item" ADD CONSTRAINT "todo_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
