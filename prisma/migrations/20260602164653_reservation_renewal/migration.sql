-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "cancelled_by" TEXT,
ADD COLUMN     "renewal_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "renewed_at" TIMESTAMP(3),
ADD COLUMN     "renewed_by" TEXT;
