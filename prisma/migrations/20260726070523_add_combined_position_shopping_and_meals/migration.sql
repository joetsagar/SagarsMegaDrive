-- AlterTable
ALTER TABLE "todo_item" ADD COLUMN     "combinedPosition" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "shopping_item" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_ingredient" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shopping_item_userId_position_idx" ON "shopping_item"("userId", "position");

-- CreateIndex
CREATE INDEX "meal_userId_createdAt_idx" ON "meal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "meal_ingredient_mealId_idx" ON "meal_ingredient"("mealId");

-- CreateIndex
CREATE INDEX "todo_item_userId_combinedPosition_idx" ON "todo_item"("userId", "combinedPosition");

-- AddForeignKey
ALTER TABLE "shopping_item" ADD CONSTRAINT "shopping_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal" ADD CONSTRAINT "meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_ingredient" ADD CONSTRAINT "meal_ingredient_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
