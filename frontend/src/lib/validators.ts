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

export type CreateTaskInput = z.input<typeof createTaskSchema>;

export const rescheduleTaskSchema = z.object({
  scheduled_date: z.string().min(1, "Data obbligatoria"),
});

export type RescheduleTaskInput = z.infer<typeof rescheduleTaskSchema>;

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

const optStr = z.string().optional().or(z.literal(""));
const optUrl = z.string().url().optional().or(z.literal(""));

export const applianceSchema = z.object({
  type: z.string().min(1, "Tipo obbligatorio"),
  brand: z.string().optional().or(z.literal("")),
  model: z.string().optional().or(z.literal("")),
  serial: z.string().optional().or(z.literal("")),
  photo_url: z.string().optional().or(z.literal("")),
  purchase_year: z.number().int().optional().nullable(),
  warranty_expiry: z.string().optional().or(z.literal("")),
  manual_url: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const customerCareQASchema = z.object({
  question: z.string().min(1, "Domanda obbligatoria"),
  answer: z.string().optional().or(z.literal("")),
});

export const documentEntrySchema = z.object({
  label: z.string().min(1, "Etichetta obbligatoria"),
  file_url: z.string().optional().or(z.literal("")),
  uploaded_at: z.string().optional().or(z.literal("")),
});

export const requiredPhotoSchema = z.object({
  label: z.string().min(1),
  photo_url: z.string().optional().or(z.literal("")),
  uploaded_at: z.string().optional().or(z.literal("")),
});

export const acRemotePhotoSchema = z.object({
  label: z.string().optional().or(z.literal("")),
  photo_url: z.string().optional().or(z.literal("")),
});

export const masterfileSchema = z.object({
  // Legacy fields
  plumber_name: optStr,
  plumber_phone: optStr,
  electrician_name: optStr,
  electrician_phone: optStr,
  cleaner_notes: optStr,
  cadastral_id: optStr,
  cie_code: optStr,
  tourism_license: optStr,
  custom_fields: customFieldsSchema.optional(),
  cover_photo_url: optUrl,
  floorplan_url: optUrl,
  additional_photos: z.array(masterFilePhotoSchema).optional(),
  drive_folder_url: optUrl,

  // Section 1 — General info
  maps_coordinates: optStr,
  maps_link: optStr,
  building_entry_name: optStr,
  building_directions: optStr,
  parking_info: optStr,
  ztl_zone: z.boolean().optional().nullable(),
  ztl_details: optStr,

  // Section 2 — Access
  access_type: optStr,
  lockbox_position: optStr,
  lockbox_code: optStr,
  lockbox_photo_url: optStr,
  smart_lock_model: optStr,
  spare_keys_location: optStr,
  door_blocked_procedure: optStr,
  access_emergency_contact: optStr,

  // Section 3 — Electricity
  electricity_meter_location: optStr,
  electricity_meter_photo_url: optStr,
  electricity_panel_location: optStr,
  electricity_panel_photo_url: optStr,
  electricity_power_kw: z.number().optional().nullable(),
  electricity_provider: optStr,
  electricity_client_number: optStr,
  electricity_reset_procedure: optStr,

  // Section 3 — Gas
  gas_meter_location_detail: optStr,
  gas_meter_photo_url: optStr,
  gas_valve_location: optStr,
  gas_provider: optStr,
  gas_client_number: optStr,
  gas_emergency_contact: optStr,

  // Section 3 — Water
  water_meter_location: optStr,
  water_meter_photo_url: optStr,
  water_shutoff_location: optStr,
  water_autoclave: z.boolean().optional().nullable(),
  water_autoclave_location: optStr,
  condo_manager_name: optStr,
  condo_manager_phone: optStr,

  // Section 4 — WiFi
  wifi_provider: optStr,
  wifi_contract_number: optStr,
  wifi_modem_serial: optStr,
  wifi_line_type: optStr,
  wifi_sim_number: optStr,
  wifi_ssid: optStr,
  wifi_password: optStr,
  wifi_modem_photo_url: optStr,
  wifi_modem_location: optStr,
  wifi_restart_procedure: optStr,
  wifi_support_number: optStr,

  // Section 6 — Heating
  heating_type: optStr,
  boiler_brand: optStr,
  boiler_model: optStr,
  boiler_location: optStr,
  boiler_last_service: z.string().optional().or(z.literal("")),
  boiler_technician_name: optStr,
  boiler_technician_phone: optStr,
  boiler_reset_procedure: optStr,
  thermostat_model: optStr,
  thermostat_location: optStr,
  ac_guest_instructions: optStr,

  // Section 8 — Safety
  fire_extinguisher_location: optStr,
  fire_extinguisher_expiry: z.string().optional().or(z.literal("")),
  smoke_detector_location: optStr,
  gas_detector_location: optStr,
  first_aid_location: optStr,
  condo_emergency_number: optStr,
  emergency_exits: optStr,
  electric_shutters_manual: optStr,

  // Section 9 — Suppliers
  supplier_plumber_name: optStr,
  supplier_plumber_phone: optStr,
  supplier_electrician_name: optStr,
  supplier_electrician_phone: optStr,
  supplier_boiler_name: optStr,
  supplier_boiler_phone: optStr,
  supplier_locksmith_name: optStr,
  supplier_locksmith_phone: optStr,
  supplier_cleaning_name: optStr,
  supplier_cleaning_phone: optStr,
  supplier_intervention_number: optStr,

  // JSONB sections
  appliances: z.array(applianceSchema).optional().nullable(),
  waste_info: z.record(z.string(), z.unknown()).optional().nullable(),
  inventory_info: z.record(z.string(), z.unknown()).optional().nullable(),
  customer_care_qa: z.array(customerCareQASchema).optional().nullable(),
  documents: z.array(documentEntrySchema).optional().nullable(),
  required_photos: z.array(requiredPhotoSchema).optional().nullable(),
  ac_remotes_photos: z.array(acRemotePhotoSchema).optional().nullable(),
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

// ============================================
// CRM: Lead
// ============================================

export const createLeadSchema = z.object({
  first_name: z.string().min(1, "Nome obbligatorio"),
  last_name: z.string().min(1, "Cognome obbligatorio"),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  status: z.enum(["NEW", "CONTACTED", "INTERESTED", "PROPOSAL_SENT", "NEGOTIATING", "WON", "LOST"]).default("NEW"),
  source: z.enum(["MANUAL", "REFERRAL", "SOCIAL", "WEBSITE", "OTHER"]).default("MANUAL"),
  property_address: z.string().optional().or(z.literal("")),
  property_type: z.enum(["APPARTAMENTO", "VILLA", "ALTRO"]).optional(),
  estimated_rooms: z.number().int().min(0).optional(),
});

export type CreateLeadInput = z.input<typeof createLeadSchema>;

export const updateLeadSchema = createLeadSchema.partial();

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

// ============================================
// CRM: Call
// ============================================

export const createCallSchema = z.object({
  notes: z.string().min(1, "Note chiamata obbligatorie"),
  called_at: z.string().optional(),
});

export type CreateCallInput = z.infer<typeof createCallSchema>;

// ============================================
// CRM: Property Analysis
// ============================================

export const submitAnalysisSchema = z.object({
  client_name: z.string().min(1, "Nome obbligatorio"),
  client_email: z.string().email("Email non valida"),
  client_phone: z.string().optional().or(z.literal("")),
  property_address: z.string().min(1, "Indirizzo obbligatorio"),
  property_type: z.enum(["APPARTAMENTO", "VILLA", "ALTRO"]),
  bedroom_count: z.number().int().min(0, "Numero camere non valido"),
  bathroom_count: z.number().int().min(0, "Numero bagni non valido"),
  floor_area_sqm: z.number().positive().optional(),
  has_pool: z.boolean().default(false),
  has_parking: z.boolean().default(false),
  has_terrace: z.boolean().default(false),
  current_use: z.string().optional().or(z.literal("")),
  availability_notes: z.string().optional().or(z.literal("")),
  additional_notes: z.string().optional().or(z.literal("")),
});

export type SubmitAnalysisInput = z.input<typeof submitAnalysisSchema>;

export const updateAnalysisSchema = z.object({
  estimated_revenue_low: z.number().min(0).optional(),
  estimated_revenue_high: z.number().min(0).optional(),
  estimated_occupancy: z.number().int().min(0).max(100, "Occupancy massima 100%").optional(),
  propertize_fee: z.number().min(0).max(100).optional(),
  analysis_notes: z.string().optional().or(z.literal("")),
  analysis_file_url: z.string().optional().or(z.literal("")),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
});

export type UpdateAnalysisInput = z.input<typeof updateAnalysisSchema>;
