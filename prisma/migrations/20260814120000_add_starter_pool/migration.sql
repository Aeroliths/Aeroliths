-- AlterTable
ALTER TABLE "lithos" ADD COLUMN     "isStarter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "starterQuantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "starterPoolGrantedAt" TIMESTAMP(3);
