-- CreateEnum
CREATE TYPE "AiConversationMode" AS ENUM ('strategy', 'convert', 'analysis');

-- CreateEnum
CREATE TYPE "AiConversationStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "mode" "AiConversationMode" NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "target_platform" VARCHAR(80),
    "source_platform" VARCHAR(80),
    "status" "AiConversationStatus" NOT NULL DEFAULT 'active',
    "last_message_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "task_id" UUID,
    "content" TEXT NOT NULL,
    "content_json" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ai_tasks" ADD COLUMN "conversation_id" UUID;

-- CreateIndex
CREATE INDEX "ai_conversations_user_id_mode_last_message_at_idx" ON "ai_conversations"("user_id", "mode", "last_message_at");

-- CreateIndex
CREATE INDEX "ai_conversations_status_last_message_at_idx" ON "ai_conversations"("status", "last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_messages_task_id_key" ON "ai_messages"("task_id");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_id_created_at_idx" ON "ai_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_messages_user_id_created_at_idx" ON "ai_messages"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_tasks_conversation_id_created_at_idx" ON "ai_tasks"("conversation_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "ai_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Supabase client roles must not access business tables directly.
ALTER TABLE "ai_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_messages" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  role_name text;
  table_name text;
  table_names text[] := ARRAY[
    'ai_conversations',
    'ai_messages'
  ];
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      FOREACH table_name IN ARRAY table_names
      LOOP
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, role_name);
      END LOOP;
    END IF;
  END LOOP;
END $$;
