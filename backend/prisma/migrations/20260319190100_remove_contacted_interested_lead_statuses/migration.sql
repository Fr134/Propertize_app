-- Migrate any existing leads with removed statuses to NEW
UPDATE "leads" SET "status" = 'NEW' WHERE "status" IN ('CONTACTED', 'INTERESTED');

-- Recreate the enum without CONTACTED and INTERESTED
ALTER TYPE "LeadStatus" RENAME TO "LeadStatus_old";
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'PROPOSAL_SENT', 'NEGOTIATING', 'WON', 'LOST');
ALTER TABLE "leads" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "status" TYPE "LeadStatus" USING ("status"::text::"LeadStatus");
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'NEW';
DROP TYPE "LeadStatus_old";
