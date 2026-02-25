-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "assigned_to_id" UUID;

-- AlterTable
ALTER TABLE "onboarding_workflows" ADD COLUMN     "assigned_to_id" UUID;

-- AlterTable
ALTER TABLE "property_analyses" ADD COLUMN     "assigned_to_id" UUID;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "analysis_assignment_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leads_assignment_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "onboarding_assignment_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "operations_assignment_count" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_analyses" ADD CONSTRAINT "property_analyses_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_workflows" ADD CONSTRAINT "onboarding_workflows_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
