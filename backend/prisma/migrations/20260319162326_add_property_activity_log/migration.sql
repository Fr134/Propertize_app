-- CreateEnum
CREATE TYPE "ActivityLogCategory" AS ENUM ('MANUTENZIONE', 'PROBLEMA', 'NOTA', 'ISPEZIONE');

-- CreateTable
CREATE TABLE "property_activity_logs" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "date" DATE NOT NULL,
    "category" "ActivityLogCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_activity_logs_property_id_date_idx" ON "property_activity_logs"("property_id", "date");

-- AddForeignKey
ALTER TABLE "property_activity_logs" ADD CONSTRAINT "property_activity_logs_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_activity_logs" ADD CONSTRAINT "property_activity_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
