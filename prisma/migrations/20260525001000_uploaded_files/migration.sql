-- CreateEnum
CREATE TYPE "UploadedFileParseStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "UploadedFileScanStatus" AS ENUM ('PASSED', 'BLOCKED', 'WARNING');

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "ext" VARCHAR(16) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "content_text" TEXT NOT NULL,
    "parse_status" "UploadedFileParseStatus" NOT NULL,
    "scan_status" "UploadedFileScanStatus" NOT NULL,
    "risk_flags" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ai_tasks" ADD COLUMN "input_file_id" UUID;

-- CreateIndex
CREATE INDEX "uploaded_files_user_id_created_at_idx" ON "uploaded_files"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "uploaded_files_sha256_idx" ON "uploaded_files"("sha256");

-- CreateIndex
CREATE INDEX "ai_tasks_input_file_id_idx" ON "ai_tasks"("input_file_id");

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_input_file_id_fkey" FOREIGN KEY ("input_file_id") REFERENCES "uploaded_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Supabase client roles must not access business tables directly.
ALTER TABLE "uploaded_files" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "uploaded_files" FROM anon;
REVOKE ALL ON TABLE "uploaded_files" FROM authenticated;
