-- CreateTable
CREATE TABLE "payment_tables" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "enterprise_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "down_payment_pct" DECIMAL(5,2) NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 120,
    "interest_rate" DECIMAL(6,4) NOT NULL,
    "indexer" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payment_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_queues" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy" TEXT NOT NULL DEFAULT 'round_robin',
    "enterprise_id" TEXT,
    "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "member_ids" TEXT[],
    "last_pick_idx" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_queues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_tables_tenant_id_is_active_idx" ON "payment_tables"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "payment_tables_tenant_id_enterprise_id_idx" ON "payment_tables"("tenant_id", "enterprise_id");

-- CreateIndex
CREATE INDEX "lead_queues_tenant_id_is_active_idx" ON "lead_queues"("tenant_id", "is_active");

-- AddForeignKey
ALTER TABLE "payment_tables" ADD CONSTRAINT "payment_tables_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_tables" ADD CONSTRAINT "payment_tables_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_queues" ADD CONSTRAINT "lead_queues_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
