ALTER TABLE "recharge_plans"
  ADD COLUMN "plan_type" VARCHAR(20) NOT NULL DEFAULT 'permanent',
  ADD COLUMN "validity_days" INTEGER,
  ADD COLUMN "purchase_limit" INTEGER;

CREATE TABLE "credit_grants" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "grant_type" VARCHAR(20) NOT NULL,
  "source_type" VARCHAR(80) NOT NULL,
  "source_id" VARCHAR(120) NOT NULL,
  "initial_amount" INTEGER NOT NULL,
  "remaining_amount" INTEGER NOT NULL,
  "expires_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "credit_grants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "credit_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "credit_grants_source_type_source_id_grant_type_key"
  ON "credit_grants"("source_type", "source_id", "grant_type");

CREATE INDEX "credit_grants_user_id_grant_type_expires_at_idx"
  ON "credit_grants"("user_id", "grant_type", "expires_at");

CREATE INDEX "credit_grants_user_id_remaining_amount_idx"
  ON "credit_grants"("user_id", "remaining_amount");

INSERT INTO "credit_grants" (
  "id",
  "user_id",
  "grant_type",
  "source_type",
  "source_id",
  "initial_amount",
  "remaining_amount",
  "expires_at",
  "created_at",
  "updated_at"
)
SELECT
  "user_id",
  "user_id",
  'permanent',
  'legacy_balance',
  "user_id"::text,
  "balance",
  "balance",
  NULL,
  "updated_at",
  "updated_at"
FROM "credit_accounts"
WHERE "balance" > 0
ON CONFLICT ("source_type", "source_id", "grant_type") DO NOTHING;

CREATE UNIQUE INDEX "orders_user_promo_paid_once_idx"
  ON "orders"("user_id", "plan_id")
  WHERE "status" = 'PAID' AND "plan_id" = 'promo';
