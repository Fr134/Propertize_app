// ============================================
// Propertize Housekeeping App - Type Definitions
// ============================================

// --- Enums ---

export enum UserRole {
  MANAGER = "MANAGER",
  OPERATOR = "OPERATOR",
}

export enum PropertyType {
  APPARTAMENTO = "APPARTAMENTO",
  VILLA = "VILLA",
  ALTRO = "ALTRO",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum SupplyCategory {
  CAFFE = "CAFFE",
  TE = "TE",
  ZUCCHERO = "ZUCCHERO",
  CARTA_IGIENICA = "CARTA_IGIENICA",
  TOVAGLIOLI = "TOVAGLIOLI",
  SAPONE_MANI = "SAPONE_MANI",
  SHAMPOO = "SHAMPOO",
  BAGNOSCHIUMA = "BAGNOSCHIUMA",
  ALTRO = "ALTRO",
}

export enum SupplyLevel {
  OK = "OK",
  IN_ESAURIMENTO = "IN_ESAURIMENTO",
  ESAURITO = "ESAURITO",
}

export enum LinenType {
  LENZUOLA = "LENZUOLA",
  ASCIUGAMANI = "ASCIUGAMANI",
  TOVAGLIE = "TOVAGLIE",
}

export enum LinenStatus {
  SPORCA = "SPORCA",
  IN_LAVAGGIO = "IN_LAVAGGIO",
  PRONTA = "PRONTA",
}

export enum ReportCategory {
  DANNO = "DANNO",
  MANUTENZIONE = "MANUTENZIONE",
  OGGETTO_MANCANTE = "OGGETTO_MANCANTE",
}

export enum ReportPriority {
  BASSA = "BASSA",
  MEDIA = "MEDIA",
  ALTA = "ALTA",
}

export enum ReportStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
}

// --- Checklist Template Item ---

export interface ChecklistTemplateItem {
  area: string;
  description: string;
  photo_required: boolean;
}

// --- Checklist Data (compiled during task) ---

export interface ChecklistDataItem extends ChecklistTemplateItem {
  completed: boolean;
  photo_urls: string[];
  notes?: string;
}

// --- API Response Types ---

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Dashboard KPI ---

export interface ManagerDashboard {
  pendingApproval: number;
  openReports: {
    alta: number;
    media: number;
    bassa: number;
  };
  lowSupplies: number;
  todayTasks: {
    completed: number;
    total: number;
  };
}
