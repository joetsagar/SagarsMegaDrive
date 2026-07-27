-- CreateTable
CREATE TABLE "todo_template_item" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todo_template_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "todo_template_item_userId_position_idx" ON "todo_template_item"("userId", "position");

-- AddForeignKey
ALTER TABLE "todo_template_item" ADD CONSTRAINT "todo_template_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
