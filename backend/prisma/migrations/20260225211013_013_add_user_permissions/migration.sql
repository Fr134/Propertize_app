-- AlterTable
ALTER TABLE "users" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowed_property_ids" JSONB,
ADD COLUMN     "can_do_analysis" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_manage_finance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_manage_leads" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_manage_onboarding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_manage_operations" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_manage_team" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_super_admin" BOOLEAN NOT NULL DEFAULT false;
