-- AlterTable
ALTER TABLE "level_rewards" ADD COLUMN     "chestTypeId" TEXT;

-- CreateTable
CREATE TABLE "chest_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "chest_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loot_entries" (
    "id" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "chestTypeId" TEXT NOT NULL,
    "lithosId" TEXT NOT NULL,

    CONSTRAINT "loot_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_chests" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "chestTypeId" TEXT NOT NULL,

    CONSTRAINT "user_chests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chest_types_name_key" ON "chest_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "loot_entries_chestTypeId_lithosId_key" ON "loot_entries"("chestTypeId", "lithosId");

-- CreateIndex
CREATE UNIQUE INDEX "user_chests_userId_chestTypeId_key" ON "user_chests"("userId", "chestTypeId");

-- AddForeignKey
ALTER TABLE "level_rewards" ADD CONSTRAINT "level_rewards_chestTypeId_fkey" FOREIGN KEY ("chestTypeId") REFERENCES "chest_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot_entries" ADD CONSTRAINT "loot_entries_chestTypeId_fkey" FOREIGN KEY ("chestTypeId") REFERENCES "chest_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot_entries" ADD CONSTRAINT "loot_entries_lithosId_fkey" FOREIGN KEY ("lithosId") REFERENCES "lithos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_chests" ADD CONSTRAINT "user_chests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_chests" ADD CONSTRAINT "user_chests_chestTypeId_fkey" FOREIGN KEY ("chestTypeId") REFERENCES "chest_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
