import { z } from "zod";

// ============================================
// JSON Field Schemas
// ============================================

// --- ChecklistTemplate items field ---

export const subTaskSchema = z.object({
  id: z.string(),
  label: z.string(),
  completed: z.boolean(),
});

export const checklistSupplyItemSchema = z.object({
  supply_item_id: z.string(),
  label: z.string(),
  expected_qty: z.number().int().positive(),
});

export const checklistAreaSchema = z.object({
  id: z.string(),
  area: z.string(),
  description: z.string(),
  photo_required: z.boolean(),
  sub_tasks: z.array(subTaskSchema),
  supply_items: z.array(checklistSupplyItemSchema),
});

export const checklistTemplateSchema = z.array(checklistAreaSchema);

// --- Task checklist_data field (operator-filled) ---

export const checklistAreaDataSchema = checklistAreaSchema.extend({
  completed: z.boolean(),
  photo_urls: z.array(z.string()),
  notes: z.string().nullable(),
  sub_tasks: z.array(subTaskSchema.extend({ completed: z.boolean() })),
  supply_items: z.array(
    checklistSupplyItemSchema.extend({ qty_used: z.number().int().min(0) })
  ),
});

export const checklistDataSchema = z.array(checklistAreaDataSchema);

// --- PropertyMasterFile custom_fields ---

export const customFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
});

export const customFieldsSchema = z.array(customFieldSchema);

// --- PropertyMasterFile additional_photos ---

export const masterFilePhotoSchema = z.object({
  url: z.string(),
  caption: z.string().nullable(),
});

// ============================================
// Auth
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// Property
// ============================================

export const createPropertySchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  code: z.string().min(1, "Codice obbligatorio"),
  address: z.string().min(1, "Indirizzo obbligatorio"),
  property_type: z.enum(["APPARTAMENTO", "VILLA", "ALTRO"]),
  owner_id: z.string().uuid("ID proprietario non valido").optional().or(z.literal("")),
  bedroom_count: z.number().int().min(0).optional(),
  bathroom_count: z.number().int().min(0).optional(),
  max_guests: z.number().int().min(0).optional(),
  floor_area_sqm: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

// ============================================
// Owner
// ============================================

export const createOwnerSchema = z.object({
  name: z.string().min(1, "Nome proprietario obbligatorio"),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  fiscal_code: z.string().optional().or(z.literal("")),
  iban: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type CreateOwnerInput = z.infer<typeof createOwnerSchema>;

export const updateOwnerSchema = z.object({
  name: z.string().min(1, "Nome proprietario obbligatorio").optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  fiscal_code: z.string().optional().or(z.literal("")),
  iban: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type UpdateOwnerInput = z.infer<typeof updateOwnerSchema>;

// ============================================
// External Contact
// ============================================

export const createExternalContactSchema = z.object({
  name: z.string().min(1, "Nome contatto obbligatorio"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  category: z.enum([
    "PLUMBER", "ELECTRICIAN", "CLEANER", "HANDYMAN", "INSPECTOR", "OTHER",
  ]),
  notes: z.string().optional().or(z.literal("")),
});

export type CreateExternalContactInput = z.infer<typeof createExternalContactSchema>;

// ============================================
// Checklist Template (legacy V1 format — kept for backward compat)
// ============================================

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

export const staySupplyTemplateSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Testo scorta obbligatorio"),
  supplyItemId: z.string().uuid().optional().nullable(),
  expectedQty: z.number().int().positive().optional().default(1),
});

export const updateChecklistTemplateSchema = z.object({
  items: z.array(checklistTemplateItemSchema).min(1, "Almeno un item richiesto"),
  staySupplies: z.array(staySupplyTemplateSchema).optional().default([]),
});

export type UpdateChecklistTemplateInput = z.infer<typeof updateChecklistTemplateSchema>;

// ============================================
// Task
// ============================================

export const createTaskSchema = z.object({
  property_id: z.string().uuid("ID immobile non valido"),
  task_type: z.enum([
    "CLEANING", "PREPARATION", "MAINTENANCE", "INSPECTION", "KEY_HANDOVER", "OTHER",
  ]).default("CLEANING"),
  title: z.string().optional(),
  scheduled_date: z.string().min(1, "Data obbligatoria"),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  assigned_to: z.string().uuid("ID operatrice non valido").optional(),
  external_assignee_id: z.string().uuid("ID contatto esterno non valido").optional(),
  assignee_type: z.enum(["INTERNAL", "EXTERNAL"]).default("INTERNAL"),
  can_use_supplies: z.boolean().default(true),
  notes: z.string().optional(),
}).refine(
  (data) => data.task_type !== "CLEANING" || !!data.assigned_to,
  { message: "Operatrice obbligatoria per task di pulizia", path: ["assigned_to"] }
).refine(
  (data) => data.assignee_type !== "EXTERNAL" || !!data.external_assignee_id,
  { message: "Contatto esterno obbligatorio per incarichi esterni", path: ["external_assignee_id"] }
);

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

// ============================================
// Supply (property-level stock update)
// ============================================

export const updateSupplySchema = z.object({
  property_id: z.string().uuid(),
  task_id: z.string().uuid().optional(),
  supplies: z.array(
    z.object({
      category: z.string().uuid(),
      level: z.enum(["OK", "IN_ESAURIMENTO", "ESAURITO"]),
    })
  ),
});

export type UpdateSupplyInput = z.infer<typeof updateSupplySchema>;

// ============================================
// Linen
// ============================================

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

// ============================================
// Expense
// ============================================

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

// ============================================
// Maintenance Report
// ============================================

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

// ============================================
// Inventory: Supply Item
// ============================================

export const createSupplyItemSchema = z.object({
  name: z.string().min(1, "Nome articolo obbligatorio"),
  sku: z.string().optional().or(z.literal("")),
  unit: z.string().min(1).default("pz"),
});

export type CreateSupplyItemInput = z.infer<typeof createSupplyItemSchema>;

export const updateSupplyItemSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().optional().or(z.literal("")),
  unit: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateSupplyItemInput = z.infer<typeof updateSupplyItemSchema>;

// ============================================
// Inventory: Stock Adjustment
// ============================================

export const adjustStockSchema = z.object({
  qty_on_hand: z.number().int().min(0, "Quantita' non puo' essere negativa"),
  reorder_point: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

// ============================================
// Inventory: Task Supply Usage
// ============================================

export const updateTaskSupplyUsageSchema = z.object({
  supply_item_id: z.string().uuid(),
  qty_used: z.number().int().min(0, "Quantita' deve essere >= 0"),
});

export type UpdateTaskSupplyUsageInput = z.infer<typeof updateTaskSupplyUsageSchema>;

// ============================================
// Inventory: Purchase Order
// ============================================

export const createPurchaseOrderSchema = z.object({
  order_ref: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  lines: z.array(z.object({
    supply_item_id: z.string().uuid(),
    qty_ordered: z.number().int().positive("Quantita' deve essere > 0"),
    unit_cost: z.number().min(0).optional(),
  })).min(1, "Almeno una riga richiesta"),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

export const receivePurchaseOrderSchema = z.object({
  lines: z.array(z.object({
    supply_item_id: z.string().uuid(),
    qty_received: z.number().int().min(0),
  })).min(1),
});

export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;

// ============================================
// Property Masterfile
// ============================================

export const masterfileSchema = z.object({
  plumber_name: z.string().optional().or(z.literal("")),
  plumber_phone: z.string().optional().or(z.literal("")),
  electrician_name: z.string().optional().or(z.literal("")),
  electrician_phone: z.string().optional().or(z.literal("")),
  cleaner_notes: z.string().optional().or(z.literal("")),
  cadastral_id: z.string().optional().or(z.literal("")),
  cie_code: z.string().optional().or(z.literal("")),
  tourism_license: z.string().optional().or(z.literal("")),
  custom_fields: customFieldsSchema.optional(),
  cover_photo_url: z.string().url().optional().or(z.literal("")),
  floorplan_url: z.string().url().optional().or(z.literal("")),
  additional_photos: z.array(masterFilePhotoSchema).optional(),
  drive_folder_url: z.string().url().optional().or(z.literal("")),
});

export type MasterfileInput = z.infer<typeof masterfileSchema>;

export const updatePropertyOperationalSchema = z.object({
  wifi_network: z.string().optional().or(z.literal("")),
  wifi_password: z.string().optional().or(z.literal("")),
  door_code: z.string().optional().or(z.literal("")),
  alarm_code: z.string().optional().or(z.literal("")),
  gas_meter_location: z.string().optional().or(z.literal("")),
  water_shutoff: z.string().optional().or(z.literal("")),
  electricity_panel: z.string().optional().or(z.literal("")),
  trash_schedule: z.string().optional().or(z.literal("")),
  checkin_notes: z.string().optional().or(z.literal("")),
  checkout_notes: z.string().optional().or(z.literal("")),
  internal_notes: z.string().optional().or(z.literal("")),
});

export type UpdatePropertyOperationalInput = z.infer<typeof updatePropertyOperationalSchema>;

// ============================================
// Property Inventory Item
// ============================================

export const createInventoryItemSchema = z.object({
  room: z.string().min(1, "Stanza obbligatoria"),
  name: z.string().min(1, "Nome oggetto obbligatorio"),
  brand: z.string().optional().or(z.literal("")),
  model: z.string().optional().or(z.literal("")),
  serial_number: z.string().optional().or(z.literal("")),
  purchase_date: z.string().optional().or(z.literal("")),
  warranty_expires: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  photo_url: z.string().optional().or(z.literal("")),
  condition: z.enum(["GOOD", "DAMAGED", "BROKEN", "REPLACED"]).default("GOOD"),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
