-- AlterTable: Property — link opzionale a DotHouse
ALTER TABLE "properties" ADD COLUMN "dotthouse_property_id" TEXT;

-- CreateIndex: unique constraint su dotthouse_property_id
CREATE UNIQUE INDEX "properties_dotthouse_property_id_key" ON "properties"("dotthouse_property_id");

-- AlterTable: DothouseBooking — modalità scheduling
ALTER TABLE "dotthouse_bookings" ADD COLUMN "scheduling_mode" TEXT NOT NULL DEFAULT 'pending';
