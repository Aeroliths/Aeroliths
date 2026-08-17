-- AlterTable
ALTER TABLE "users" ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "opponent" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "boardSize" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "scoreSelf" INTEGER NOT NULL,
    "scoreOpponent" INTEGER NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matches_userId_playedAt_idx" ON "matches"("userId", "playedAt");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
