import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson, type PaginatedResponse } from "@/lib/fetch";
import type { CreateTaskInput, ReviewTaskInput, ReopenTaskInput } from "@/lib/validators";

// --- Types ---

interface TaskProperty {
  id: string;
  name: string;
  code: string;
  address?: string;
}

interface TaskOperator {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

interface TaskPhoto {
  id: string;
  task_id: string;
  checklist_item_index: number;
  photo_url: string;
  uploaded_at: string;
}

interface SubTaskData {
  id: string;
  text: string;
  completed: boolean;
}

interface StaySupplyData {
  id: string;
  text: string;
  checked: boolean;
  supplyItemId?: string | null;
  expectedQty?: number;
  qtyUsed?: number;
}

interface ChecklistDataItem {
  area: string;
  description: string;
  photo_required: boolean;
  completed: boolean;
  photo_urls: string[];
  notes: string;
  subTasks?: SubTaskData[];
}

interface TaskListItem {
  id: string;
  property_id: string;
  assigned_to: string | null;
  scheduled_date: string;
  status: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  task_type?: string;
  title?: string | null;
  assignee_type?: string;
  property: TaskProperty;
  operator: TaskOperator | null;
}

// checklist_data can be old array format or new object format
type ChecklistRaw =
  | ChecklistDataItem[]
  | { areas: ChecklistDataItem[]; staySupplies: StaySupplyData[] }
  | null;

interface TaskSupplyUsage {
  id: string;
  task_id: string;
  supply_item_id: string;
  expected_qty: number;
  qty_used: number;
  supply_item: { name: string; unit: string };
}

interface TaskDetail extends TaskListItem {
  checklist_data: ChecklistRaw;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_notes: string | null;
  reopen_note: string | null;
  reopen_at: string | null;
  reviewer: { id: string; first_name: string; last_name: string } | null;
  photos: TaskPhoto[];
  supply_usages?: TaskSupplyUsage[];
}

// --- Filters ---

interface TaskFilters {
  assigned_to?: string;
  status?: string;
  date?: string;
}

function buildQueryString(filters: TaskFilters): string {
  const params = new URLSearchParams();
  if (filters.assigned_to) params.set("assigned_to", filters.assigned_to);
  if (filters.status) params.set("status", filters.status);
  if (filters.date) params.set("date", filters.date);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// --- Hooks ---

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const res = await fetchJson<PaginatedResponse<TaskListItem>>(`/api/tasks${buildQueryString(filters)}`);
      return res.data;
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => fetchJson<TaskDetail>(`/api/tasks/${id}`),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskInput) =>
      fetchJson("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useStartTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      fetchJson(`/api/tasks/${taskId}/start`, { method: "PATCH" }),
    onSuccess: (_data, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
    },
  });
}

type ChecklistUpdatePayload =
  | { itemIndex: number; completed?: boolean; notes?: string }
  | { type: "AREA_SUBTASK_TOGGLE"; itemIndex: number; subTaskId: string; completed: boolean }
  | { type: "SUPPLY_TOGGLE"; supplyId: string; checked: boolean }
  | { type: "SUPPLY_QTY_UPDATE"; supplyId: string; checked: boolean; qtyUsed: number };

export function useUpdateChecklistItem(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChecklistUpdatePayload) =>
      fetchJson(`/api/tasks/${taskId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
    },
  });
}

export function useSaveTaskPhoto(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { checklistItemIndex: number; photoUrl: string }) =>
      fetchJson(`/api/tasks/${taskId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      fetchJson(`/api/tasks/${taskId}/complete`, { method: "PATCH" }),
    onSuccess: (_data, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
    },
  });
}

export function useReviewTask(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewTaskInput) =>
      fetchJson(`/api/tasks/${taskId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      fetchJson(`/api/tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useReopenTask(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReopenTaskInput) =>
      fetchJson(`/api/tasks/${taskId}/reopen`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
    },
  });
}

// Helper to normalize checklist_data (old array or new object format)
export function parseChecklist(raw: ChecklistRaw): {
  areas: ChecklistDataItem[];
  staySupplies: StaySupplyData[];
} {
  if (!raw) return { areas: [], staySupplies: [] };
  if (Array.isArray(raw)) return { areas: raw, staySupplies: [] };
  return {
    areas: raw.areas ?? [],
    staySupplies: raw.staySupplies ?? [],
  };
}

export type { TaskListItem, TaskDetail, TaskPhoto, TaskSupplyUsage, ChecklistDataItem, StaySupplyData, TaskFilters };
