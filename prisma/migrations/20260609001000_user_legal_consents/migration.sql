-- CreateTable
CREATE TABLE "user_legal_consents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "agreement_version" VARCHAR(40) NOT NULL,
    "privacy_version" VARCHAR(40) NOT NULL,
    "agreed_at" TIMESTAMPTZ(3) NOT NULL,
    "request_ip" VARCHAR(80),
    "user_agent" VARCHAR(512),
    "source" VARCHAR(40) NOT NULL,

    CONSTRAINT "user_legal_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_legal_consents_user_id_agreement_version_privacy_version_key" ON "user_legal_consents"("user_id", "agreement_version", "privacy_version");

-- CreateIndex
CREATE INDEX "user_legal_consents_user_id_agreed_at_idx" ON "user_legal_consents"("user_id", "agreed_at");

-- AddForeignKey
ALTER TABLE "user_legal_consents" ADD CONSTRAINT "user_legal_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase client roles must not access business tables directly.
ALTER TABLE "user_legal_consents" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', 'user_legal_consents', role_name);
    END IF;
  END LOOP;
END $$;
