-- Existing accounts predate email verification. Mark them verified to preserve access.
ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMP(3);

-- Auth lookups normalize incoming addresses. Normalize legacy rows as well so
-- mixed-case or padded emails keep working after the cutover. The deployment
-- preflight must reject normalized duplicates before this statement runs.
UPDATE "users"
SET "email" = LOWER(BTRIM("email"))
WHERE "email" <> LOWER(BTRIM("email"));

UPDATE "users"
SET "email_verified_at" = COALESCE("updated_at", "created_at", CURRENT_TIMESTAMP)
WHERE "email_verified_at" IS NULL;

CREATE TABLE "registration_challenges" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "resend_available_at" TIMESTAMP(3) NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "last_sent_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "registration_challenges_email_key"
ON "registration_challenges"("email");

CREATE INDEX "registration_challenges_student_id_consumed_at_expires_at_idx"
ON "registration_challenges"("student_id", "consumed_at", "expires_at");

CREATE INDEX "registration_challenges_expires_at_idx"
ON "registration_challenges"("expires_at");
