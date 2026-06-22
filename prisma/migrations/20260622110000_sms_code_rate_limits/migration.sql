ALTER TABLE "sms_codes"
  ADD COLUMN "failed_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "last_failed_at" TIMESTAMPTZ(3);

CREATE INDEX "sms_codes_phone_scene_created_at_idx"
  ON "sms_codes"("phone", "scene", "created_at");

CREATE INDEX "sms_codes_request_ip_created_at_idx"
  ON "sms_codes"("request_ip", "created_at");
