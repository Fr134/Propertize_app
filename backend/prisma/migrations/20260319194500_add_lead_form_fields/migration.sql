-- AlterTable
ALTER TABLE "leads" ADD COLUMN "form_url" TEXT;
ALTER TABLE "leads" ADD COLUMN "notion_page_url" TEXT;
ALTER TABLE "leads" ADD COLUMN "form_submitted_at" TIMESTAMP(3);
