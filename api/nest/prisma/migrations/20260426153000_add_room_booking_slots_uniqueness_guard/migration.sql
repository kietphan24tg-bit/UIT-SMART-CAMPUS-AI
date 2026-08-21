DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "room_booking_slots"
    GROUP BY "room_id", "booking_date", "time_slot_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce unique room booking slot constraint: duplicate (room_id, booking_date, time_slot_id) rows exist in room_booking_slots.';
  END IF;
END $$;

DROP INDEX IF EXISTS "room_booking_slots_room_id_booking_date_time_slot_id_idx";

CREATE UNIQUE INDEX "room_booking_slots_room_id_booking_date_time_slot_id_key"
ON "room_booking_slots"("room_id", "booking_date", "time_slot_id");
