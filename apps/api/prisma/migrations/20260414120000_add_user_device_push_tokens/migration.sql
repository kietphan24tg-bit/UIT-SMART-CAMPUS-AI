-- CreateTable
CREATE TABLE "user_device_push_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expo_push_token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "device_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_device_push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_device_push_tokens_user_id_idx" ON "user_device_push_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_device_push_tokens_user_id_expo_push_token_key" ON "user_device_push_tokens"("user_id", "expo_push_token");

-- AddForeignKey
ALTER TABLE "user_device_push_tokens" ADD CONSTRAINT "user_device_push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
