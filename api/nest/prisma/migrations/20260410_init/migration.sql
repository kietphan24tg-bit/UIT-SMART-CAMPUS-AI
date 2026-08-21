-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('student', 'lecturer', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('inactive', 'pending', 'active', 'expired');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "ParkingSessionStatus" AS ENUM ('active', 'completed');

-- CreateEnum
CREATE TYPE "ScheduleSessionType" AS ENUM ('daytime', 'evening');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "student_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" "Role" NOT NULL DEFAULT 'student',
    "faculty" TEXT,
    "major" TEXT,
    "year_of_admission" INTEGER,
    "phone" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_otps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "term" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "description" TEXT,
    "faculty" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_sections" (
    "id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "class_code" TEXT NOT NULL,
    "section_code" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "class_section_id" TEXT NOT NULL,
    "instructor" TEXT,
    "room" TEXT,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "start_period" INTEGER,
    "end_period" INTEGER,
    "session_type" "ScheduleSessionType" NOT NULL DEFAULT 'daytime',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "midterm" DOUBLE PRECISION,
    "final_exam" DOUBLE PRECISION,
    "assignment" DOUBLE PRECISION,
    "total_score" DOUBLE PRECISION,
    "letter_grade" TEXT,
    "grade_point" DOUBLE PRECISION,
    "is_exempt" BOOLEAN NOT NULL DEFAULT false,
    "earned_credits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "rfid_tag" TEXT NOT NULL,
    "label" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_subscriptions" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "monthly_fee" INTEGER NOT NULL DEFAULT 40000,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'inactive',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "last_payment_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "provider" TEXT NOT NULL,
    "provider_order_id" TEXT NOT NULL,
    "request_id" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "checkout_url" TEXT,
    "request_payload" JSONB,
    "response_payload" JSONB,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_sessions" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "gate_id" TEXT NOT NULL,
    "status" "ParkingSessionStatus" NOT NULL DEFAULT 'active',
    "recognized_entry_plate" TEXT NOT NULL,
    "recognized_exit_plate" TEXT,
    "entry_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exit_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_slots" (
    "id" TEXT NOT NULL,
    "gate_id" TEXT NOT NULL,
    "zone" TEXT NOT NULL DEFAULT 'Main',
    "slot_number" TEXT NOT NULL,
    "is_occupied" BOOLEAN NOT NULL DEFAULT false,
    "vehicle_plate" TEXT,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_snapshots" (
    "id" TEXT NOT NULL,
    "gate_id" TEXT NOT NULL,
    "device_ip" TEXT,
    "slot_bitmap" TEXT,
    "slots" JSONB NOT NULL,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "rain_detected" BOOLEAN NOT NULL DEFAULT false,
    "fire_detected" BOOLEAN NOT NULL DEFAULT false,
    "reported_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fire_alerts" (
    "id" TEXT NOT NULL,
    "gate_id" TEXT NOT NULL,
    "telemetry_snapshot_id" TEXT,
    "message" TEXT NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "reported_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fire_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_student_id_key" ON "users"("student_id");

-- CreateIndex
CREATE INDEX "password_reset_otps_user_id_consumed_at_expires_at_idx" ON "password_reset_otps"("user_id", "consumed_at", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "class_sections_class_code_key" ON "class_sections"("class_code");

-- CreateIndex
CREATE UNIQUE INDEX "class_sections_semester_id_course_id_section_code_key" ON "class_sections"("semester_id", "course_id", "section_code");

-- CreateIndex
CREATE INDEX "schedule_items_user_id_day_of_week_start_time_idx" ON "schedule_items"("user_id", "day_of_week", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "grades_user_id_course_id_semester_id_key" ON "grades"("user_id", "course_id", "semester_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_number_key" ON "vehicles"("plate_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_rfid_tag_key" ON "vehicles"("rfid_tag");

-- CreateIndex
CREATE INDEX "vehicles_user_id_idx" ON "vehicles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "parking_subscriptions_vehicle_id_key" ON "parking_subscriptions"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_provider_order_id_key" ON "payment_transactions"("provider_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_request_id_key" ON "payment_transactions"("request_id");

-- CreateIndex
CREATE INDEX "payment_transactions_vehicle_id_status_idx" ON "payment_transactions"("vehicle_id", "status");

-- CreateIndex
CREATE INDEX "parking_sessions_vehicle_id_status_idx" ON "parking_sessions"("vehicle_id", "status");

-- CreateIndex
CREATE INDEX "parking_sessions_gate_id_status_idx" ON "parking_sessions"("gate_id", "status");

-- CreateIndex
CREATE INDEX "parking_slots_gate_id_is_occupied_idx" ON "parking_slots"("gate_id", "is_occupied");

-- CreateIndex
CREATE UNIQUE INDEX "parking_slots_gate_id_slot_number_key" ON "parking_slots"("gate_id", "slot_number");

-- CreateIndex
CREATE INDEX "telemetry_snapshots_gate_id_reported_at_idx" ON "telemetry_snapshots"("gate_id", "reported_at");

-- CreateIndex
CREATE INDEX "fire_alerts_gate_id_reported_at_idx" ON "fire_alerts"("gate_id", "reported_at");

-- AddForeignKey
ALTER TABLE "password_reset_otps" ADD CONSTRAINT "password_reset_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_items" ADD CONSTRAINT "schedule_items_class_section_id_fkey" FOREIGN KEY ("class_section_id") REFERENCES "class_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_subscriptions" ADD CONSTRAINT "parking_subscriptions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "parking_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fire_alerts" ADD CONSTRAINT "fire_alerts_telemetry_snapshot_id_fkey" FOREIGN KEY ("telemetry_snapshot_id") REFERENCES "telemetry_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
