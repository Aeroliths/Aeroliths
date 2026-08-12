-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_path_key" ON "media_assets"("path");

-- CreateIndex
CREATE INDEX "media_assets_category_createdAt_idx" ON "media_assets"("category", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_category_hash_key" ON "media_assets"("category", "hash");
