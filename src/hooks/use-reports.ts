import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson, type PaginatedResponse } from "@/lib/fetch";
import type { CreateReportInput, UpdateReportStatusInput } from "@/lib/validators";

interface ReportListItem {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  property: { id: string; name: string; code: string };
  author: { id: string; first_name: string; last_name: string };
  _count: { photos: number };
}

interface ReportPhoto {
  id: string;
  photo_url: string;
  uploaded_at: string;
}

interface ReportDetail extends Omit<ReportListItem, "_count"> {
  description: string;
  task_id: string | null;
  task: { id: string; scheduled_date: string } | null;
  resolved_at: string | null;
  updated_at: string;
  photos: ReportPhoto[];
}

interface ReportFilters {
  property_id?: string;
  status?: string;
  priority?: string;
}

function buildQs(filters: ReportFilters) {
  const p = new URLSearchParams();
  if (filters.property_id) p.set("property_id", filters.property_id);
  if (filters.status) p.set("status", filters.status);
  if (filters.priority) p.set("priority", filters.priority);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export function useReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ["reports", filters],
    queryFn: async () => {
      const res = await fetchJson<PaginatedResponse<ReportListItem>>(`/api/reports${buildQs(filters)}`);
      return res.data;
    },
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ["reports", id],
    queryFn: () => fetchJson<ReportDetail>(`/api/reports/${id}`),
    enabled: !!id,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReportInput) =>
      fetchJson("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateReportStatus(reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateReportStatusInput) =>
      fetchJson(`/api/reports/${reportId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports", reportId] });
    },
  });
}

export type { ReportListItem, ReportDetail, ReportFilters };
