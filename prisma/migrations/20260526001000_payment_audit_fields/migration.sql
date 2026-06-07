-- AlterTable
ALTER TABLE "payment_transactions"
ADD COLUMN "verified_at" TIMESTAMPTZ(3),
ADD COLUMN "failed_reason" TEXT,
ADD COLUMN "order_status_before" "OrderStatus",
ADD COLUMN "order_status_after" "OrderStatus";

CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");
