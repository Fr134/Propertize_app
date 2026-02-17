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

export enum TransactionType {
  PURCHASE_IN = "PURCHASE_IN",
  CONSUMPTION_OUT = "CONSUMPTION_OUT",
  ADJUSTMENT = "ADJUSTMENT",
}

export enum PurchaseOrderStatus {
  DRAFT = "DRAFT",
  ORDERED = "ORDERED",
  RECEIVED = "RECEIVED",
  CANCELLED = "CANCELLED",
}

// --- Owner ---

export interface Owner {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
}

// --- Stay supply types ---

export interface StaySupplyTemplate {
  id: string;
  text: string;
  supplyItemId?: string | null;
  expectedQty?: number;
}

export interface StaySupplyData {
  id: string;
  text: string;
  checked: boolean;
  supplyItemId?: string | null;
  expectedQty?: number;
  qtyUsed?: number;
}

// --- Sub-task types ---

export interface SubTaskTemplate {
  id: string;
  text: string;
}

export interface SubTaskData {
  id: string;
  text: string;
  completed: boolean;
}

// --- Checklist Template Item ---

export interface ChecklistTemplateItem {
  area: string;
  description: string;
  photo_required: boolean;
  subTasks?: SubTaskTemplate[];
}

// --- Checklist Data (compiled during task) ---

export interface ChecklistDataItem extends Omit<ChecklistTemplateItem, "subTasks"> {
  completed: boolean;
  photo_urls: string[];
  notes?: string;
  subTasks?: SubTaskData[];
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

// --- Inventory ---

export interface SupplyItem {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  is_active: boolean;
  created_at: string;
}

export interface InventoryBalanceItem {
  id: string;
  supply_item_id: string;
  qty_on_hand: number;
  reorder_point: number;
  supply_item: SupplyItem;
}

export interface InventoryTransactionItem {
  id: string;
  supply_item_id: string;
  type: TransactionType;
  qty: number;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  supply_item: { name: string; unit: string };
}

export interface TaskSupplyUsageItem {
  id: string;
  task_id: string;
  supply_item_id: string;
  expected_qty: number;
  qty_used: number;
  supply_item: { name: string; unit: string };
}

export interface PurchaseOrderListItem {
  id: string;
  order_ref: string | null;
  status: PurchaseOrderStatus;
  notes: string | null;
  ordered_at: string | null;
  received_at: string | null;
  created_at: string;
  _count: { lines: number };
}

export interface PurchaseOrderDetail extends Omit<PurchaseOrderListItem, "_count"> {
  lines: PurchaseOrderLineItem[];
}

export interface PurchaseOrderLineItem {
  id: string;
  supply_item_id: string;
  qty_ordered: number;
  qty_received: number;
  unit_cost: number | null;
  supply_item: { name: string; unit: string };
}

export interface ConsumptionSummaryItem {
  supply_item_id: string;
  name: string;
  unit: string;
  total_consumed: number;
  task_count: number;
}

export interface ForecastItem {
  supply_item_id: string;
  name: string;
  unit: string;
  qty_on_hand: number;
  avg_daily_consumption: number;
  days_remaining: number | null;
  needs_reorder: boolean;
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
