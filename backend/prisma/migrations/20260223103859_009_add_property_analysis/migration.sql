-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "property_analyses" (
    "id" UUID NOT NULL,
    "lead_id" UUID,
    "client_name" TEXT NOT NULL,
    "client_email" TEXT NOT NULL,
    "client_phone" TEXT,
    "property_address" TEXT NOT NULL,
    "property_type" "PropertyType" NOT NULL,
    "bedroom_count" INTEGER NOT NULL,
    "bathroom_count" INTEGER NOT NULL,
    "floor_area_sqm" DOUBLE PRECISION,
    "has_pool" BOOLEAN NOT NULL DEFAULT false,
    "has_parking" BOOLEAN NOT NULL DEFAULT false,
    "has_terrace" BOOLEAN NOT NULL DEFAULT false,
    "current_use" TEXT,
    "availability_notes" TEXT,
    "additional_notes" TEXT,
    "estimated_revenue_low" DECIMAL(10,2),
    "estimated_revenue_high" DECIMAL(10,2),
    "estimated_occupancy" INTEGER,
    "propertize_fee" DECIMAL(5,2),
    "analysis_notes" TEXT,
    "analysis_file_url" TEXT,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "token" TEXT NOT NULL,

    CONSTRAINT "property_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_analyses_token_key" ON "property_analyses"("token");

-- AddForeignKey
ALTER TABLE "property_analyses" ADD CONSTRAINT "property_analyses_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
