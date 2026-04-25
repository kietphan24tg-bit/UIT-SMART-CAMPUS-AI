-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('active', 'dropped');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('planned', 'open', 'closed');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('workshop', 'seminar', 'community', 'club');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoomBookingStatus" ADD VALUE 'rejected';
ALTER TYPE "RoomBookingStatus" ADD VALUE 'cancelled';

-- AlterTable
ALTER TABLE "class_sections" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 40,
ADD COLUMN     "lecturer_id" TEXT,
ADD COLUMN     "registration_open" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3);

UPDATE "class_sections"
SET "updated_at" = CURRENT_TIMESTAMP
WHERE "updated_at" IS NULL;

ALTER TABLE "class_sections"
ALTER COLUMN "updated_at" SET NOT NULL;

-- CreateTable
CREATE TABLE "class_meetings" (
    "id" TEXT NOT NULL,
    "class_section_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "room" TEXT,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "start_period" INTEGER,
    "end_period" INTEGER,
    "session_type" "ScheduleSessionType" NOT NULL DEFAULT 'daytime',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_enrollments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_section_id" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'active',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dropped_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "content_html" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'planned',
    "category" "EventCategory" NOT NULL DEFAULT 'workshop',
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "max_attendees" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "checked_in_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_meetings_class_section_id_day_of_week_start_time_idx" ON "class_meetings"("class_section_id", "day_of_week", "start_time");

-- CreateIndex
CREATE INDEX "class_enrollments_class_section_id_status_idx" ON "class_enrollments"("class_section_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "class_enrollments_student_id_class_section_id_key" ON "class_enrollments"("student_id", "class_section_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_status_start_at_idx" ON "events"("status", "start_at");

-- CreateIndex
CREATE INDEX "event_registrations_user_id_registered_at_idx" ON "event_registrations"("user_id", "registered_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_event_id_user_id_key" ON "event_registrations"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "class_sections_lecturer_id_semester_id_idx" ON "class_sections"("lecturer_id", "semester_id");

-- AddForeignKey
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_meetings" ADD CONSTRAINT "class_meetings_class_section_id_fkey" FOREIGN KEY ("class_section_id") REFERENCES "class_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_class_section_id_fkey" FOREIGN KEY ("class_section_id") REFERENCES "class_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

