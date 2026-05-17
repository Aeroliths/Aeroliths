-- CreateTable
CREATE TABLE "site_visits" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_visits_visitedAt_idx" ON "site_visits"("visitedAt");

-- CreateIndex
CREATE INDEX "site_visits_visitorId_visitedAt_idx" ON "site_visits"("visitorId", "visitedAt");
