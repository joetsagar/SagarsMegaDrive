-- AlterTable
ALTER TABLE "todo_item" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "todo_item_userId_archived_idx" ON "todo_item"("userId", "archived");
