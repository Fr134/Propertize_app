import type { z } from "zod";
import type {
  subTaskSchema,
  checklistSupplyItemSchema,
  checklistAreaSchema,
  checklistTemplateSchema,
  checklistAreaDataSchema,
  checklistDataSchema,
  customFieldSchema,
  customFieldsSchema,
  masterFilePhotoSchema,
} from "@/lib/validators";

// ============================================
// JSON Field Types (derived from Zod schemas)
// Single source of truth: validators.ts
// ============================================

// --- ChecklistTemplate items field ---

export type SubTask = z.infer<typeof subTaskSchema>;

export type ChecklistSupplyItem = z.infer<typeof checklistSupplyItemSchema>;

export type ChecklistArea = z.infer<typeof checklistAreaSchema>;

export type ChecklistTemplate = z.infer<typeof checklistTemplateSchema>;

// --- Task checklist_data field (operator-filled) ---

export type ChecklistAreaData = z.infer<typeof checklistAreaDataSchema>;

export type ChecklistData = z.infer<typeof checklistDataSchema>;

// --- PropertyMasterFile custom_fields ---

export type CustomField = z.infer<typeof customFieldSchema>;

export type CustomFields = z.infer<typeof customFieldsSchema>;

// --- PropertyMasterFile additional_photos ---

export type MasterFilePhoto = z.infer<typeof masterFilePhotoSchema>;

// --- DothouseBooking raw_data ---

export type DothouseRawData = Record<string, unknown>;
