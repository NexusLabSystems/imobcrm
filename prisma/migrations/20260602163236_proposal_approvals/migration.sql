-- CreateTable
CREATE TABLE "proposal_approvals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proposal_approvals_proposal_id_level_idx" ON "proposal_approvals"("proposal_id", "level");

-- AddForeignKey
ALTER TABLE "proposal_approvals" ADD CONSTRAINT "proposal_approvals_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_approvals" ADD CONSTRAINT "proposal_approvals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
