import { z } from "zod";

// --- Auth ---

export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// --- Property ---

export const createPropertySchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  code: z.string().min(1, "Codice obbligatorio"),
  address: z.string().min(1, "Indirizzo obbligatorio"),
  property_type: z.enum(["APPARTAMENTO", "VILLA", "ALTRO"]),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

// --- Checklist Template ---

export const subTaskTemplateSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Testo sub-task obbligatorio"),
});

export const checklistTemplateItemSchema = z.object({
  area: z.string().min(1, "Nome area obbligatorio"),
  description: z.string().min(1, "Descrizione obbligatoria"),
  photo_required: z.boolean(),
  subTasks: z.array(subTaskTemplateSchema).optional().default([]),
});

export const updateChecklistTemplateSchema = z.object({
  items: z.array(checklistTemplateItemSchema).min(1, "Almeno un item richiesto"),
});

export type UpdateChecklistTemplateInput = z.infer<typeof updateChecklistTemplateSchema>;

// --- Cleaning Task ---

export const createTaskSchema = z.object({
  property_id: z.string().uuid("ID immobile non valido"),
  assigned_to: z.string().uuid("ID operatrice non valido"),
  scheduled_date: z.string().min(1, "Data obbligatoria"),
  notes: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const reviewTaskSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

export type ReviewTaskInput = z.infer<typeof reviewTaskSchema>;

export const reopenTaskSchema = z.object({
  note: z.string().min(5, "La nota deve avere almeno 5 caratteri"),
});

export type ReopenTaskInput = z.infer<typeof reopenTaskSchema>;

// --- Supply ---

export const updateSupplySchema = z.object({
  property_id: z.string().uuid(),
  task_id: z.string().uuid().optional(),
  supplies: z.array(
    z.object({
      category: z.enum([
        "CAFFE", "TE", "ZUCCHERO", "CARTA_IGIENICA",
        "TOVAGLIOLI", "SAPONE_MANI", "SHAMPOO", "BAGNOSCHIUMA", "ALTRO",
      ]),
      level: z.enum(["OK", "IN_ESAURIMENTO", "ESAURITO"]),
    })
  ),
});

export type UpdateSupplyInput = z.infer<typeof updateSupplySchema>;

// --- Linen ---

export const updateLinenSchema = z.object({
  property_id: z.string().uuid(),
  linen: z.array(
    z.object({
      type: z.enum(["LENZUOLA", "ASCIUGAMANI", "TOVAGLIE"]),
      status: z.enum(["SPORCA", "IN_LAVAGGIO", "PRONTA"]),
      quantity: z.number().int().min(0),
    })
  ),
});

export type UpdateLinenInput = z.infer<typeof updateLinenSchema>;

// --- Expense ---

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Descrizione obbligatoria"),
  amount: z.number().positive("L'importo deve essere maggiore di 0"),
  vat_amount: z.number().min(0, "L'IVA non può essere negativa").optional(),
  expense_date: z.string().optional(),
}).refine(
  (data) => !data.vat_amount || data.vat_amount <= data.amount,
  { message: "L'IVA non può superare l'importo totale", path: ["vat_amount"] }
);

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// --- Maintenance Report ---

export const createReportSchema = z.object({
  property_id: z.string().uuid("ID immobile non valido"),
  task_id: z.string().uuid().optional(),
  title: z.string().min(1, "Titolo obbligatorio"),
  description: z.string().min(1, "Descrizione obbligatoria"),
  category: z.enum(["DANNO", "MANUTENZIONE", "OGGETTO_MANCANTE"]),
  priority: z.enum(["BASSA", "MEDIA", "ALTA"]),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
});

export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
