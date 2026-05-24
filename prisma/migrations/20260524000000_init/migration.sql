-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "SmsScene" AS ENUM ('login');

-- CreateEnum
CREATE TYPE "CreditLedgerDirection" AS ENUM ('in', 'out');

-- CreateEnum
CREATE TYPE "CreditLedgerStatus" AS ENUM ('posted', 'voided');

-- CreateEnum
CREATE TYPE "CreditLedgerType" AS ENUM ('bonus', 'recharge', 'consume', 'refund');

-- CreateEnum
CREATE TYPE "PayChannel" AS ENUM ('wechat', 'alipay', 'mock');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CLOSED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('wechat', 'alipay', 'mock');

-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('NOTIFIED', 'VERIFIED', 'DUPLICATE', 'FAILED');

-- CreateEnum
CREATE TYPE "AiTaskType" AS ENUM ('strategy_generation', 'code_conversion', 'code_analysis');

-- CreateEnum
CREATE TYPE "AiTaskStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AiTaskScopeStatus" AS ENUM ('in_scope', 'out_of_scope');

-- CreateEnum
CREATE TYPE "CreditReservationStatus" AS ENUM ('RESERVED', 'CONFIRMED', 'RELEASED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "display_name" VARCHAR(80) NOT NULL,
    "invite_code" VARCHAR(32) NOT NULL,
    "referred_by" UUID,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "last_login_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_codes" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "scene" "SmsScene" NOT NULL,
    "code_hash" VARCHAR(255),
    "mock_code" VARCHAR(32),
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "request_ip" VARCHAR(80),
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sms_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_accounts" (
    "user_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL,
    "total_earned" INTEGER NOT NULL,
    "total_spent" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "credit_accounts_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "credit_ledger" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "request_id" VARCHAR(80) NOT NULL,
    "scene" VARCHAR(80) NOT NULL,
    "type" "CreditLedgerType" NOT NULL,
    "direction" "CreditLedgerDirection" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "status" "CreditLedgerStatus" NOT NULL,
    "source_type" VARCHAR(80) NOT NULL,
    "source_id" VARCHAR(120) NOT NULL,
    "idempotency_key" VARCHAR(160) NOT NULL,
    "remark" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_reservations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "CreditReservationStatus" NOT NULL,
    "idempotency_key" VARCHAR(160) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "credit_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recharge_plans" (
    "id" VARCHAR(40) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "bonus_points" INTEGER NOT NULL,
    "total_points" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "sort" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recharge_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_no" VARCHAR(80) NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" VARCHAR(40) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "bonus_points" INTEGER NOT NULL,
    "total_points" INTEGER NOT NULL,
    "pay_channel" "PayChannel" NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "client_request_id" VARCHAR(120) NOT NULL,
    "paid_at" TIMESTAMPTZ(3),
    "closed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_trade_no" VARCHAR(120) NOT NULL,
    "notify_id" VARCHAR(160) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "status" "PaymentTransactionStatus" NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "idempotency_key" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tasks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "AiTaskType" NOT NULL,
    "status" "AiTaskStatus" NOT NULL,
    "scope_status" "AiTaskScopeStatus" NOT NULL DEFAULT 'in_scope',
    "source_platform" VARCHAR(80),
    "target_platform" VARCHAR(80),
    "prompt" TEXT,
    "input_code" TEXT,
    "cost_points" INTEGER NOT NULL,
    "client_request_id" VARCHAR(120) NOT NULL,
    "request_id" VARCHAR(80) NOT NULL,
    "error_code" VARCHAR(80),
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(3),
    "finished_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_task_results" (
    "task_id" UUID NOT NULL,
    "result_type" "AiTaskType" NOT NULL,
    "scope_status" "AiTaskScopeStatus" NOT NULL,
    "generated_code" TEXT,
    "explanation" TEXT,
    "migration_notes" TEXT,
    "risk_warnings" JSONB NOT NULL,
    "report_json" JSONB,
    "model" VARCHAR(120) NOT NULL,
    "token_usage" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_task_results_pkey" PRIMARY KEY ("task_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_invite_code_key" ON "users"("invite_code");

-- CreateIndex
CREATE INDEX "sms_codes_phone_scene_expires_at_idx" ON "sms_codes"("phone", "scene", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "credit_ledger_idempotency_key_key" ON "credit_ledger"("idempotency_key");

-- CreateIndex
CREATE INDEX "credit_ledger_user_id_created_at_idx" ON "credit_ledger"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "credit_reservations_task_id_key" ON "credit_reservations"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_reservations_idempotency_key_key" ON "credit_reservations"("idempotency_key");

-- CreateIndex
CREATE INDEX "credit_reservations_user_id_status_idx" ON "credit_reservations"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_no_key" ON "orders"("order_no");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_user_id_client_request_id_key" ON "orders"("user_id", "client_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_idempotency_key_key" ON "payment_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "payment_transactions_order_id_idx" ON "payment_transactions"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_provider_notify_id_key" ON "payment_transactions"("provider", "notify_id");

-- CreateIndex
CREATE INDEX "ai_tasks_user_id_created_at_idx" ON "ai_tasks"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_tasks_user_id_client_request_id_key" ON "ai_tasks"("user_id", "client_request_id");

-- AddForeignKey
ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_reservations" ADD CONSTRAINT "credit_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_reservations" ADD CONSTRAINT "credit_reservations_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "ai_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "recharge_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_task_results" ADD CONSTRAINT "ai_task_results_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "ai_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
