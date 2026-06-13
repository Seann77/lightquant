CREATE TYPE "AiRunEventStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');

CREATE TYPE "AiRunEventVisibility" AS ENUM ('public', 'debug', 'admin_only');

CREATE TABLE "ai_run_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "conversation_id" UUID,
    "user_id" UUID NOT NULL,
    "seq" INTEGER NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "status" "AiRunEventStatus" NOT NULL DEFAULT 'running',
    "title" VARCHAR(160) NOT NULL,
    "summary" TEXT,
    "detail_json" JSONB,
    "progress_percent" INTEGER,
    "visibility" "AiRunEventVisibility" NOT NULL DEFAULT 'public',
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_run_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_run_events_task_id_seq_key"
  ON "ai_run_events"("task_id", "seq");

CREATE INDEX "ai_run_events_task_id_created_at_idx"
  ON "ai_run_events"("task_id", "created_at");

CREATE INDEX "ai_run_events_conversation_id_created_at_idx"
  ON "ai_run_events"("conversation_id", "created_at");

CREATE INDEX "ai_run_events_user_id_created_at_idx"
  ON "ai_run_events"("user_id", "created_at");

ALTER TABLE "ai_run_events"
  ADD CONSTRAINT "ai_run_events_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "ai_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_run_events"
  ADD CONSTRAINT "ai_run_events_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_run_events"
  ADD CONSTRAINT "ai_run_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_run_events" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', 'ai_run_events', role_name);
    END IF;
  END LOOP;
END $$;
