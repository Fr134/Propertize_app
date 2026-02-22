-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('CLEANING', 'PREPARATION', 'MAINTENANCE', 'INSPECTION', 'KEY_HANDOVER', 'OTHER');

-- CreateEnum
CREATE TYPE "AssigneeType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "ExternalContactCategory" AS ENUM ('PLUMBER', 'ELECTRICIAN', 'CLEANER', 'HANDYMAN', 'INSPECTOR', 'OTHER');

-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'DONE';

-- CreateTable: external_contacts
CREATE TABLE "external_contacts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "company" TEXT,
    "category" "ExternalContactCategory" NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_contacts_pkey" PRIMARY KEY ("id")
);

-- DropForeignKey from cleaning_tasks
ALTER TABLE "cleaning_tasks" DROP CONSTRAINT "cleaning_tasks_assigned_to_fkey";
ALTER TABLE "cleaning_tasks" DROP CONSTRAINT "cleaning_tasks_property_id_fkey";
ALTER TABLE "cleaning_tasks" DROP CONSTRAINT "cleaning_tasks_reopen_by_fkey";
ALTER TABLE "cleaning_tasks" DROP CONSTRAINT "cleaning_tasks_reviewed_by_fkey";

-- DropForeignKey from task_photos
ALTER TABLE "task_photos" DROP CONSTRAINT "task_photos_task_id_fkey";

-- DropForeignKey from maintenance_reports
ALTER TABLE "maintenance_reports" DROP CONSTRAINT "maintenance_reports_task_id_fkey";

-- DropForeignKey from cleaning_task_supply_usages
ALTER TABLE "cleaning_task_supply_usages" DROP CONSTRAINT "cleaning_task_supply_usages_task_id_fkey";
ALTER TABLE "cleaning_task_supply_usages" DROP CONSTRAINT "cleaning_task_supply_usages_supply_item_id_fkey";

-- RenameTable: cleaning_tasks -> tasks
ALTER TABLE "cleaning_tasks" RENAME TO "tasks";

-- RenameTable: cleaning_task_supply_usages -> task_supply_usages
ALTER TABLE "cleaning_task_supply_usages" RENAME TO "task_supply_usages";

-- Rename PK constraints
ALTER INDEX "cleaning_tasks_pkey" RENAME TO "tasks_pkey";
ALTER INDEX "cleaning_task_supply_usages_pkey" RENAME TO "task_supply_usages_pkey";

-- Rename unique constraint
ALTER INDEX "cleaning_task_supply_usages_task_id_supply_item_id_key" RENAME TO "task_supply_usages_task_id_supply_item_id_key";

-- Make assigned_to nullable
ALTER TABLE "tasks" ALTER COLUMN "assigned_to" DROP NOT NULL;

-- Add new columns to tasks
ALTER TABLE "tasks" ADD COLUMN "task_type" "TaskType" NOT NULL DEFAULT 'CLEANING';
ALTER TABLE "tasks" ADD COLUMN "title" TEXT;
ALTER TABLE "tasks" ADD COLUMN "start_time" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN "end_time" TIMESTAMP(3);
ALTER TABLE "tasks" ADD COLUMN "assignee_type" "AssigneeType" NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE "tasks" ADD COLUMN "external_assignee_id" UUID;
ALTER TABLE "tasks" ADD COLUMN "can_use_supplies" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tasks" ADD COLUMN "dotthouse_booking_id" UUID;

-- Recreate FK on tasks
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reopen_by_fkey" FOREIGN KEY ("reopen_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_external_assignee_id_fkey" FOREIGN KEY ("external_assignee_id") REFERENCES "external_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Recreate FK on task_photos
ALTER TABLE "task_photos" ADD CONSTRAINT "task_photos_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Recreate FK on maintenance_reports
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Recreate FK on task_supply_usages
ALTER TABLE "task_supply_usages" ADD CONSTRAINT "task_supply_usages_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_supply_usages" ADD CONSTRAINT "task_supply_usages_supply_item_id_fkey" FOREIGN KEY ("supply_item_id") REFERENCES "supply_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey from supply_levels
ALTER TABLE "supply_levels" DROP CONSTRAINT "supply_levels_property_id_fkey";

-- DropTable: supply_levels
DROP TABLE "supply_levels";

-- DropEnum
DROP TYPE "SupplyCategory";
DROP TYPE "SupplyLevelEnum";
