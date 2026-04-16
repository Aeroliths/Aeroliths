-- CreateTable
CREATE TABLE "login_history" (
    "id" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_history_loggedAt_idx" ON "login_history"("loggedAt");

-- CreateIndex
CREATE INDEX "login_history_userId_loggedAt_idx" ON "login_history"("userId", "loggedAt");

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
