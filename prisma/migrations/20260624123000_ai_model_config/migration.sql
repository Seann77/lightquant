-- CreateTable
CREATE TABLE "ai_model_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(80) NOT NULL,
    "provider" VARCHAR(40) NOT NULL,
    "base_url" VARCHAR(240) NOT NULL,
    "model" VARCHAR(120) NOT NULL,
    "supports_vision" BOOLEAN NOT NULL,
    "api_key_env_name" VARCHAR(80),
    "enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_model_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_active_profile" (
    "id" VARCHAR(40) NOT NULL,
    "profile_id" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ai_model_active_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_model_profiles_enabled_provider_idx" ON "ai_model_profiles"("enabled", "provider");

-- AddForeignKey
ALTER TABLE "ai_model_active_profile" ADD CONSTRAINT "ai_model_active_profile_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "ai_model_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
