-- Phase 4: support image uploads without storing image bytes in API responses.
ALTER TABLE "uploaded_files"
  ADD COLUMN "kind" VARCHAR(40),
  ADD COLUMN "storage_key" VARCHAR(512),
  ADD COLUMN "thumbnail_key" VARCHAR(512),
  ADD COLUMN "content_json" JSONB,
  ADD COLUMN "updated_at" TIMESTAMPTZ(3);

ALTER TABLE "uploaded_files"
  ALTER COLUMN "content_text" DROP NOT NULL;

UPDATE "uploaded_files"
SET
  "kind" = CASE
    WHEN "ext" = '.py' THEN 'code'
    WHEN "ext" = '.log' THEN 'log'
    WHEN "ext" = '.md' THEN 'markdown'
    ELSE 'text'
  END,
  "updated_at" = "created_at"
WHERE "kind" IS NULL OR "updated_at" IS NULL;

CREATE INDEX "uploaded_files_user_id_kind_created_at_idx"
  ON "uploaded_files"("user_id", "kind", "created_at");
