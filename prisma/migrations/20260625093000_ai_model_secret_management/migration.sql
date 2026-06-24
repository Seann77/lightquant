CREATE TABLE "ai_model_secrets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(80) NOT NULL,
  "provider" VARCHAR(40),
  "encrypted_value" TEXT NOT NULL,
  "key_hint" VARCHAR(16),
  "created_at" TIMESTAMPTZ(3) NOT NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "ai_model_secrets_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ai_model_profiles"
  ADD COLUMN "api_key_secret_id" UUID;

CREATE INDEX "ai_model_secrets_provider_updated_at_idx"
  ON "ai_model_secrets"("provider", "updated_at");

CREATE INDEX "ai_model_profiles_api_key_secret_id_idx"
  ON "ai_model_profiles"("api_key_secret_id");

ALTER TABLE "ai_model_profiles"
  ADD CONSTRAINT "ai_model_profiles_api_key_secret_id_fkey"
  FOREIGN KEY ("api_key_secret_id")
  REFERENCES "ai_model_secrets"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
