import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson, type PaginatedResponse } from "@/lib/fetch";
import type { CreateTaskInput, ReviewTaskInput, ReopenTaskInput, RescheduleTaskInput } from "@/lib/validators";

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

interface ExternalAssignee {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
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
  task_type: string;
  title: string | null;
  assignee_type: string;
  start_time: string | null;
  end_time: string | null;
  can_use_supplies: boolean;
  is_scheduled: boolean;
  property: TaskProperty;
  operator: TaskOperator | null;
  external_assignee: ExternalAssignee | null;
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

interface TaskExternalAssigneeDetail extends ExternalAssignee {
  category?: string;
}

interface TaskDetail extends Omit<TaskListItem, "external_assignee"> {
  checklist_data: ChecklistRaw;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_notes: string | null;
  reopen_note: string | null;
  reopen_at: string | null;
  reviewer: { id: string; first_name: string; last_name: string } | null;
  photos: TaskPhoto[];
  supply_usages?: TaskSupplyUsage[];
  external_assignee: TaskExternalAssigneeDetail | null;
}

// --- Filters ---

interface TaskFilters {
  assigned_to?: string;
  status?: string;
  date?: string;
  task_type?: string;
  date_from?: string;
  date_to?: string;
  property_id?: string;
  is_scheduled?: boolean;
}

function buildQueryString(filters: TaskFilters): string {
  const params = new URLSearchParams();
  if (filters.assigned_to) params.set("assigned_to", filters.assigned_to);
  if (filters.status) params.set("status", filters.status);
  if (filters.date) params.set("date", filters.date);
  if (filters.task_type) params.set("task_type", filters.task_type);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.property_id) params.set("property_id", filters.property_id);
  if (filters.is_scheduled !== undefined) params.set("is_scheduled", String(filters.is_scheduled));
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

export function useDoneTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      fetchJson(`/api/tasks/${taskId}/done`, { method: "PATCH" }),
    onSuccess: (_data, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
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

export function useRescheduleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RescheduleTaskInput }) =>
      fetchJson(`/api/tasks/${id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
    },
  });
}

export function useUnscheduledTasks() {
  return useQuery({
    queryKey: ["tasks", { is_scheduled: false }],
    queryFn: async () => {
      const res = await fetchJson<PaginatedResponse<TaskListItem>>(
        `/api/tasks?is_scheduled=false`
      );
      return res.data;
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

export type { TaskListItem, TaskDetail, TaskPhoto, TaskSupplyUsage, ChecklistDataItem, StaySupplyData, TaskFilters, ExternalAssignee };
