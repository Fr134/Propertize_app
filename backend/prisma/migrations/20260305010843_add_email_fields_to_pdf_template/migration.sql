-- AlterTable
ALTER TABLE "pdf_templates" ADD COLUMN     "email_doc_body" TEXT,
ADD COLUMN     "email_doc_subject" TEXT,
ADD COLUMN     "email_link_body" TEXT,
ADD COLUMN     "email_link_subject" TEXT;
