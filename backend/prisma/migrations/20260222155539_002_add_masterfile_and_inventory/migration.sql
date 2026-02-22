-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('GOOD', 'DAMAGED', 'BROKEN', 'REPLACED');

-- CreateTable
CREATE TABLE "property_master_files" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "plumber_name" TEXT,
    "plumber_phone" TEXT,
    "electrician_name" TEXT,
    "electrician_phone" TEXT,
    "cleaner_notes" TEXT,
    "cadastral_id" TEXT,
    "cie_code" TEXT,
    "tourism_license" TEXT,
    "custom_fields" JSONB,
    "cover_photo_url" TEXT,
    "floorplan_url" TEXT,
    "additional_photos" JSONB,
    "drive_folder_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_master_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_inventory_items" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "room" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serial_number" TEXT,
    "purchase_date" TIMESTAMP(3),
    "warranty_expires" TIMESTAMP(3),
    "notes" TEXT,
    "photo_url" TEXT,
    "condition" "ItemCondition" NOT NULL DEFAULT 'GOOD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_master_files_property_id_key" ON "property_master_files"("property_id");

-- CreateIndex
CREATE INDEX "property_inventory_items_property_id_room_idx" ON "property_inventory_items"("property_id", "room");

-- AddForeignKey
ALTER TABLE "property_master_files" ADD CONSTRAINT "property_master_files_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_inventory_items" ADD CONSTRAINT "property_inventory_items_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
