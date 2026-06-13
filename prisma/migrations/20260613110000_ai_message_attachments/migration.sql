-- Phase 3: explicitly associate uploaded text/code/log files with conversation messages.
CREATE TYPE "AiMessageAttachmentRole" AS ENUM ('input', 'reference', 'generated');

CREATE TABLE "ai_message_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "role" "AiMessageAttachmentRole" NOT NULL DEFAULT 'input',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "caption" VARCHAR(255),
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_message_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_message_attachments_message_id_file_id_role_key"
  ON "ai_message_attachments"("message_id", "file_id", "role");

CREATE INDEX "ai_message_attachments_message_id_display_order_idx"
  ON "ai_message_attachments"("message_id", "display_order");

CREATE INDEX "ai_message_attachments_conversation_id_created_at_idx"
  ON "ai_message_attachments"("conversation_id", "created_at");

CREATE INDEX "ai_message_attachments_file_id_idx"
  ON "ai_message_attachments"("file_id");

CREATE INDEX "ai_message_attachments_user_id_created_at_idx"
  ON "ai_message_attachments"("user_id", "created_at");

ALTER TABLE "ai_message_attachments"
  ADD CONSTRAINT "ai_message_attachments_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "ai_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_message_attachments"
  ADD CONSTRAINT "ai_message_attachments_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_message_attachments"
  ADD CONSTRAINT "ai_message_attachments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_message_attachments"
  ADD CONSTRAINT "ai_message_attachments_file_id_fkey"
  FOREIGN KEY ("file_id") REFERENCES "uploaded_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_message_attachments" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', 'ai_message_attachments', role_name);
    END IF;
  END LOOP;
END $$;
