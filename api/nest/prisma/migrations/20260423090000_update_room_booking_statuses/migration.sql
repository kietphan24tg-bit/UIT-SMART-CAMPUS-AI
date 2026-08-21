-- AlterEnum
BEGIN;
CREATE TYPE "RoomBookingStatus_new" AS ENUM ('pending', 'approved', 'booked', 'maintenance');
ALTER TABLE "room_bookings"
  ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "room_bookings"
  ALTER COLUMN "status" TYPE "RoomBookingStatus_new"
  USING (
    CASE
      WHEN "status"::text = 'cancelled' THEN 'pending'
      ELSE "status"::text
    END
  )::"RoomBookingStatus_new";
ALTER TYPE "RoomBookingStatus" RENAME TO "RoomBookingStatus_old";
ALTER TYPE "RoomBookingStatus_new" RENAME TO "RoomBookingStatus";
DROP TYPE "RoomBookingStatus_old";
ALTER TABLE "room_bookings"
  ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;
