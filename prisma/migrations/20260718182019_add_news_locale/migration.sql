-- AlterTable
ALTER TABLE "news" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';

-- DropIndex
DROP INDEX "news_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "news_slug_locale_key" ON "news"("slug", "locale");
