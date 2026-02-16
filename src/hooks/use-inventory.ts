import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson, type PaginatedResponse } from "@/lib/fetch";
import type {
  CreateSupplyItemInput,
  UpdateSupplyItemInput,
  AdjustStockInput,
  CreatePurchaseOrderInput,
  ReceivePurchaseOrderInput,
  UpdateTaskSupplyUsageInput,
} from "@/lib/validators";

// --- Types ---

interface SupplyItem {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  is_active: boolean;
  created_at: string;
}

interface InventoryBalanceItem {
  id: string;
  supply_item_id: string;
  qty_on_hand: number;
  reorder_point: number;
  supply_item: { name: string; sku: string | null; unit: string; is_active: boolean };
}

interface InventoryTransactionItem {
  id: string;
  supply_item_id: string;
  type: string;
  qty: number;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  supply_item: { name: string; unit: string };
}

interface ConsumptionSummaryItem {
  supply_item_id: string;
  name: string;
  unit: string;
  total_qty: number;
  tx_count: number;
}

interface ForecastItem {
  supply_item_id: string;
  name: string;
  unit: string;
  qty_on_hand: number;
  reorder_point: number;
  total_consumed: number;
  avg_daily: number;
  days_remaining: number | null;
  needs_reorder: boolean;
}

interface PurchaseOrderListItem {
  id: string;
  order_ref: string | null;
  status: string;
  notes: string | null;
  ordered_at: string | null;
  received_at: string | null;
  created_at: string;
  lines: PurchaseOrderLineItem[];
}

interface PurchaseOrderLineItem {
  id: string;
  supply_item_id: string;
  qty_ordered: number;
  qty_received: number;
  unit_cost: number | null;
  supply_item: { name: string; unit: string };
}

interface TaskSupplyUsageItem {
  id: string;
  task_id: string;
  supply_item_id: string;
  expected_qty: number;
  qty_used: number;
  supply_item: { name: string; unit: string };
}

// --- Filters ---

interface ItemFilters {
  active?: boolean;
  search?: string;
}

interface TransactionFilters {
  supply_item_id?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

interface ConsumptionFilters {
  [key: string]: string | number | boolean | undefined;
  from?: string;
  to?: string;
}

function buildQs(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

// --- Supply Items (Catalog) ---

export function useSupplyItems(filters: ItemFilters = {}) {
  return useQuery({
    queryKey: ["inventory", "items", filters],
    queryFn: () =>
      fetchJson<SupplyItem[]>(
        `/api/inventory/items${buildQs({ active: filters.active, search: filters.search })}`
      ),
  });
}

export function useCreateSupplyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSupplyItemInput) =>
      fetchJson("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "items"] });
    },
  });
}

export function useUpdateSupplyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSupplyItemInput & { id: string }) =>
      fetchJson(`/api/inventory/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "items"] });
      qc.invalidateQueries({ queryKey: ["inventory", "stock"] });
    },
  });
}

// --- Stock ---

export function useInventoryStock(filters: { low?: boolean } = {}) {
  return useQuery({
    queryKey: ["inventory", "stock", filters],
    queryFn: () =>
      fetchJson<InventoryBalanceItem[]>(
        `/api/inventory/stock${buildQs({ low: filters.low })}`
      ),
  });
}

export function useUpdateStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ supplyItemId, ...data }: AdjustStockInput & { supplyItemId: string }) =>
      fetchJson(`/api/inventory/stock/${supplyItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "stock"] });
      qc.invalidateQueries({ queryKey: ["inventory", "transactions"] });
      qc.invalidateQueries({ queryKey: ["inventory", "forecast"] });
    },
  });
}

// --- Transactions ---

export function useInventoryTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ["inventory", "transactions", filters],
    queryFn: () =>
      fetchJson<PaginatedResponse<InventoryTransactionItem>>(
        `/api/inventory/transactions${buildQs(filters as Record<string, string>)}`
      ),
  });
}

// --- Consumption ---

export function useConsumptionSummary(filters: ConsumptionFilters = {}) {
  return useQuery({
    queryKey: ["inventory", "consumption", filters],
    queryFn: () =>
      fetchJson<ConsumptionSummaryItem[]>(
        `/api/inventory/consumption${buildQs(filters)}`
      ),
  });
}

// --- Forecast ---

export function useInventoryForecast(days?: number) {
  return useQuery({
    queryKey: ["inventory", "forecast", days],
    queryFn: () =>
      fetchJson<ForecastItem[]>(
        `/api/inventory/forecast${buildQs({ days })}`
      ),
  });
}

// --- Purchase Orders ---

export function usePurchaseOrders(filters: { status?: string } = {}) {
  return useQuery({
    queryKey: ["inventory", "orders", filters],
    queryFn: async () => {
      const res = await fetchJson<PaginatedResponse<PurchaseOrderListItem>>(
        `/api/inventory/orders${buildQs(filters)}`
      );
      return res.data;
    },
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ["inventory", "orders", id],
    queryFn: () => fetchJson<PurchaseOrderListItem>(`/api/inventory/orders/${id}`),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchaseOrderInput) =>
      fetchJson("/api/inventory/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "orders"] });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetchJson(`/api/inventory/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "orders"] });
    },
  });
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: ReceivePurchaseOrderInput & { id: string }) =>
      fetchJson(`/api/inventory/orders/${id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory", "orders"] });
      qc.invalidateQueries({ queryKey: ["inventory", "stock"] });
      qc.invalidateQueries({ queryKey: ["inventory", "transactions"] });
      qc.invalidateQueries({ queryKey: ["inventory", "forecast"] });
    },
  });
}

// --- Task Supply Usages ---

export function useTaskSupplyUsages(taskId: string) {
  return useQuery({
    queryKey: ["tasks", taskId, "supply-usages"],
    queryFn: () => fetchJson<TaskSupplyUsageItem[]>(`/api/tasks/${taskId}/supply-usage`),
    enabled: !!taskId,
  });
}

export function useUpdateTaskSupplyUsage(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTaskSupplyUsageInput) =>
      fetchJson(`/api/tasks/${taskId}/supply-usage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", taskId, "supply-usages"] });
      qc.invalidateQueries({ queryKey: ["tasks", taskId] });
    },
  });
}

export type {
  SupplyItem,
  InventoryBalanceItem,
  InventoryTransactionItem,
  ConsumptionSummaryItem,
  ForecastItem,
  PurchaseOrderListItem,
  PurchaseOrderLineItem,
  TaskSupplyUsageItem,
};
