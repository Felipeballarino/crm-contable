-- AlterTable
ALTER TABLE "Studio" ADD COLUMN     "alertDaysBefore" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "alertEmail" TEXT;
