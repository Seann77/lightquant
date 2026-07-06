CREATE TABLE "wechat_group_qr_codes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "storage_key" VARCHAR(512) NOT NULL,
  "image_mime_type" VARCHAR(80) NOT NULL,
  "image_size_bytes" INTEGER NOT NULL,
  "image_sha256" VARCHAR(64) NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "uploaded_by_admin_user_id" UUID NOT NULL,
  "uploaded_by_admin_phone" VARCHAR(20) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL,
  "activated_at" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "wechat_group_qr_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "wechat_group_qr_codes_status_activated_at_idx"
  ON "wechat_group_qr_codes"("status", "activated_at");

CREATE INDEX "wechat_group_qr_codes_expires_at_idx"
  ON "wechat_group_qr_codes"("expires_at");

CREATE INDEX "wechat_group_qr_codes_created_at_idx"
  ON "wechat_group_qr_codes"("created_at");

CREATE UNIQUE INDEX "wechat_group_qr_codes_one_active_idx"
  ON "wechat_group_qr_codes"("status")
  WHERE "status" = 'active';
