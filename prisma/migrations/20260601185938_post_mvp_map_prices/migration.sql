-- AlterTable
ALTER TABLE "enterprises" ADD COLUMN     "map_image_url" TEXT;

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "map_x" DOUBLE PRECISION,
ADD COLUMN     "map_y" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "unit_price_history" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "changed_by" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "unit_price_history_unit_id_created_at_idx" ON "unit_price_history"("unit_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "unit_price_history_tenant_id_idx" ON "unit_price_history"("tenant_id");

-- AddForeignKey
ALTER TABLE "unit_price_history" ADD CONSTRAINT "unit_price_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_price_history" ADD CONSTRAINT "unit_price_history_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
