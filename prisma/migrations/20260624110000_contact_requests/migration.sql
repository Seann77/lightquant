-- CreateTable
CREATE TABLE "contact_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "user_phone" VARCHAR(20),
    "name" VARCHAR(80) NOT NULL,
    "contact_method" VARCHAR(20) NOT NULL,
    "contact_value" VARCHAR(160) NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "message" TEXT NOT NULL,
    "source" VARCHAR(240) NOT NULL,
    "request_ip" VARCHAR(80),
    "user_agent" VARCHAR(300),
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_requests_created_at_idx" ON "contact_requests"("created_at");

-- CreateIndex
CREATE INDEX "contact_requests_category_created_at_idx" ON "contact_requests"("category", "created_at");

-- CreateIndex
CREATE INDEX "contact_requests_contact_method_created_at_idx" ON "contact_requests"("contact_method", "created_at");

-- CreateIndex
CREATE INDEX "contact_requests_source_created_at_idx" ON "contact_requests"("source", "created_at");

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
