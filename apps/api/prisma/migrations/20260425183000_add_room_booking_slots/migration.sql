-- CreateTable
CREATE TABLE "room_booking_slots" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "booking_date" DATE NOT NULL,
    "time_slot_id" TEXT NOT NULL,
    "slot_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_booking_slots_pkey" PRIMARY KEY ("id")
);

-- Backfill single-slot bookings into room_booking_slots
INSERT INTO "room_booking_slots" (
    "id",
    "booking_id",
    "room_id",
    "booking_date",
    "time_slot_id",
    "slot_order"
)
SELECT
    "id" || '__' || "time_slot_id",
    "id",
    "room_id",
    "booking_date",
    "time_slot_id",
    1
FROM "room_bookings"
WHERE "time_slot_id" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "room_booking_slots_booking_id_time_slot_id_key" ON "room_booking_slots"("booking_id", "time_slot_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_booking_slots_booking_id_slot_order_key" ON "room_booking_slots"("booking_id", "slot_order");

-- CreateIndex
CREATE INDEX "room_booking_slots_room_id_booking_date_time_slot_id_idx" ON "room_booking_slots"("room_id", "booking_date", "time_slot_id");

-- CreateIndex
CREATE INDEX "room_booking_slots_time_slot_id_idx" ON "room_booking_slots"("time_slot_id");

-- AddForeignKey
ALTER TABLE "room_booking_slots" ADD CONSTRAINT "room_booking_slots_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "room_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_booking_slots" ADD CONSTRAINT "room_booking_slots_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_booking_slots" ADD CONSTRAINT "room_booking_slots_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "time_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
