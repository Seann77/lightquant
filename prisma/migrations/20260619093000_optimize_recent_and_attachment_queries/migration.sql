-- Optimize recent conversation paging and deterministic task/message ordering.
CREATE INDEX "ai_conversations_user_id_status_last_message_at_id_idx"
  ON "ai_conversations"("user_id", "status", "last_message_at", "id");

DROP INDEX IF EXISTS "ai_tasks_conversation_id_created_at_idx";

CREATE INDEX "ai_tasks_conversation_id_created_at_id_idx"
  ON "ai_tasks"("conversation_id", "created_at", "id");

DROP INDEX IF EXISTS "ai_messages_conversation_id_created_at_idx";

CREATE INDEX "ai_messages_conversation_id_created_at_id_idx"
  ON "ai_messages"("conversation_id", "created_at", "id");
