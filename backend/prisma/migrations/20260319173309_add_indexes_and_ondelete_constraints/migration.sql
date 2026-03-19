-- DropForeignKey
ALTER TABLE "generated_documents" DROP CONSTRAINT "generated_documents_authorization_form_id_fkey";

-- CreateIndex
CREATE INDEX "authorization_forms_owner_id_idx" ON "authorization_forms"("owner_id");

-- CreateIndex
CREATE INDEX "expense_photos_expense_id_idx" ON "expense_photos"("expense_id");

-- CreateIndex
CREATE INDEX "expenses_property_id_idx" ON "expenses"("property_id");

-- CreateIndex
CREATE INDEX "generated_documents_authorization_form_id_idx" ON "generated_documents"("authorization_form_id");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_assigned_to_id_idx" ON "leads"("assigned_to_id");

-- CreateIndex
CREATE INDEX "maintenance_reports_property_id_status_idx" ON "maintenance_reports"("property_id", "status");

-- CreateIndex
CREATE INDEX "maintenance_reports_created_by_idx" ON "maintenance_reports"("created_by");

-- CreateIndex
CREATE INDEX "property_analyses_status_idx" ON "property_analyses"("status");

-- CreateIndex
CREATE INDEX "property_analyses_lead_id_idx" ON "property_analyses"("lead_id");

-- CreateIndex
CREATE INDEX "report_photos_report_id_idx" ON "report_photos"("report_id");

-- CreateIndex
CREATE INDEX "task_photos_task_id_idx" ON "task_photos"("task_id");

-- CreateIndex
CREATE INDEX "tasks_property_id_status_idx" ON "tasks"("property_id", "status");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_status_idx" ON "tasks"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "tasks_scheduled_date_idx" ON "tasks"("scheduled_date");

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_authorization_form_id_fkey" FOREIGN KEY ("authorization_form_id") REFERENCES "authorization_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
