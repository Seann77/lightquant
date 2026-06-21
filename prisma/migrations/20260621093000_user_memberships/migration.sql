-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('beta_vip');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active');

-- CreateTable
CREATE TABLE "user_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "MembershipType" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "source_type" VARCHAR(80) NOT NULL,
    "source_id" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_memberships_user_id_type_source_type_source_id_key" ON "user_memberships"("user_id", "type", "source_type", "source_id");

-- CreateIndex
CREATE INDEX "user_memberships_user_id_type_status_starts_at_ends_at_idx" ON "user_memberships"("user_id", "type", "status", "starts_at", "ends_at");

-- AddForeignKey
ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase client roles must not access business tables directly.
ALTER TABLE "user_memberships" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', 'user_memberships', role_name);
    END IF;
  END LOOP;
END $$;
