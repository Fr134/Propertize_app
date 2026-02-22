-- CreateTable
CREATE TABLE "dotthouse_bookings" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "guest_name" TEXT,
    "checkin_date" DATE NOT NULL,
    "checkout_date" DATE NOT NULL,
    "guests_count" INTEGER,
    "platform" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "sync_status" TEXT NOT NULL DEFAULT 'pending',
    "raw_data" JSONB,
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dotthouse_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dotthouse_bookings_external_id_key" ON "dotthouse_bookings"("external_id");

-- CreateIndex
CREATE INDEX "dotthouse_bookings_property_id_checkin_date_idx" ON "dotthouse_bookings"("property_id", "checkin_date");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_dotthouse_booking_id_key" ON "tasks"("dotthouse_booking_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_dotthouse_booking_id_fkey" FOREIGN KEY ("dotthouse_booking_id") REFERENCES "dotthouse_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dotthouse_bookings" ADD CONSTRAINT "dotthouse_bookings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
