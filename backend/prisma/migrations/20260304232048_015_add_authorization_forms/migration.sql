-- CreateTable
CREATE TABLE "pdf_templates" (
    "id" UUID NOT NULL,
    "location" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "template_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdf_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorization_forms" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cognome" TEXT,
    "nome" TEXT,
    "nato_a" TEXT,
    "nato_prov" TEXT,
    "nato_il" TIMESTAMP(3),
    "codice_fiscale" TEXT,
    "residente_a" TEXT,
    "residente_cap" TEXT,
    "indirizzo_res" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "pec" TEXT,
    "ruolo" TEXT,
    "immobile_via" TEXT,
    "immobile_n" TEXT,
    "immobile_indirizzo" TEXT,
    "immobile_n2" TEXT,
    "immobile_piano" TEXT,
    "immobile_comune" TEXT,
    "immobile_cap" TEXT,
    "immobile_prov" TEXT,
    "sezione" TEXT,
    "foglio" TEXT,
    "particella" TEXT,
    "sub" TEXT,
    "categoria" TEXT,
    "denominazione" TEXT,
    "n_camere" INTEGER,
    "n_bagni" INTEGER,
    "n_posti_letto" INTEGER,
    "periodo_disponibilita" TEXT,
    "luogo_data" TEXT,

    CONSTRAINT "authorization_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_documents" (
    "id" UUID NOT NULL,
    "authorization_form_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "generated_url" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_to_client_at" TIMESTAMP(3),
    "sent_by_id" UUID,

    CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pdf_templates_location_document_type_key" ON "pdf_templates"("location", "document_type");

-- CreateIndex
CREATE UNIQUE INDEX "authorization_forms_token_key" ON "authorization_forms"("token");

-- AddForeignKey
ALTER TABLE "authorization_forms" ADD CONSTRAINT "authorization_forms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_authorization_form_id_fkey" FOREIGN KEY ("authorization_form_id") REFERENCES "authorization_forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "pdf_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_sent_by_id_fkey" FOREIGN KEY ("sent_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
