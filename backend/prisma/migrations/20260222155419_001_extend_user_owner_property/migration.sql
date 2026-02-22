-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('MAINTENANCE', 'CLEANING', 'UTILITIES', 'SUPPLIES', 'INSURANCE', 'TAX', 'OTHER');

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "category" "ExpenseCategory";

-- AlterTable
ALTER TABLE "owners" ADD COLUMN     "address" TEXT,
ADD COLUMN     "contract_signed_at" TIMESTAMP(3),
ADD COLUMN     "fiscal_code" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alarm_code" TEXT,
ADD COLUMN     "bathroom_count" INTEGER,
ADD COLUMN     "bedroom_count" INTEGER,
ADD COLUMN     "checkin_notes" TEXT,
ADD COLUMN     "checkout_notes" TEXT,
ADD COLUMN     "contract_url" TEXT,
ADD COLUMN     "door_code" TEXT,
ADD COLUMN     "electricity_panel" TEXT,
ADD COLUMN     "floor_area_sqm" DECIMAL(8,2),
ADD COLUMN     "floor_number" INTEGER,
ADD COLUMN     "gas_meter_location" TEXT,
ADD COLUMN     "has_elevator" BOOLEAN,
ADD COLUMN     "has_parking" BOOLEAN,
ADD COLUMN     "has_pool" BOOLEAN,
ADD COLUMN     "internal_notes" TEXT,
ADD COLUMN     "max_guests" INTEGER,
ADD COLUMN     "trash_schedule" TEXT,
ADD COLUMN     "water_shutoff" TEXT,
ADD COLUMN     "wifi_network" TEXT,
ADD COLUMN     "wifi_password" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "phone" TEXT;
