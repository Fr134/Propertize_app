import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";

// --- Types ---

interface ActivityLogAuthor {
  id: string;
  first_name: string;
  last_name: string;
}

export interface ActivityLog {
  id: string;
  property_id: string;
  created_by: string;
  date: string;
  category: "MANUTENZIONE" | "PROBLEMA" | "NOTA" | "ISPEZIONE";
  title: string;
  description: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  author: ActivityLogAuthor;
}

export interface ActivityLogFilters {
  category?: string;
  from?: string;
  to?: string;
}

// --- Hooks ---

export function useActivityLogs(propertyId: string, filters: ActivityLogFilters = {}) {
  return useQuery({
    queryKey: ["activity-logs", propertyId, filters],
    queryFn: () => {
      const params = new URLSearchParams({ property_id: propertyId });
      if (filters.category) params.set("category", filters.category);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      return fetchJson<ActivityLog[]>(`/api/activity-logs?${params}`);
    },
    enabled: !!propertyId,
  });
}

export function useCreateActivityLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      property_id: string;
      date: string;
      category: string;
      title: string;
      description?: string;
      is_resolved?: boolean;
    }) =>
      fetchJson("/api/activity-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });
}

export function useUpdateActivityLog(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      date?: string;
      category?: string;
      title?: string;
      description?: string | null;
      is_resolved?: boolean;
    }) =>
      fetchJson(`/api/activity-logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });
}

export function useDeleteActivityLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/activity-logs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });
}
