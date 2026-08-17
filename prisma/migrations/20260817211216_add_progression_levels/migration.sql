-- AlterTable
ALTER TABLE "users" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "progression_levels" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "xpRequired" INTEGER NOT NULL,

    CONSTRAINT "progression_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_rewards" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'lithos',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "lithosId" TEXT,

    CONSTRAINT "level_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "progression_levels_level_key" ON "progression_levels"("level");

-- CreateIndex
CREATE UNIQUE INDEX "level_rewards_level_key" ON "level_rewards"("level");

-- AddForeignKey
ALTER TABLE "level_rewards" ADD CONSTRAINT "level_rewards_lithosId_fkey" FOREIGN KEY ("lithosId") REFERENCES "lithos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
