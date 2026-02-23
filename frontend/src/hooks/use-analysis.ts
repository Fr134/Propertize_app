import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { SubmitAnalysisInput, UpdateAnalysisInput } from "@/lib/validators";

// --- Types ---

export interface AnalysisListItem {
  id: string;
  lead_id: string | null;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  property_address: string;
  property_type: string;
  bedroom_count: number;
  bathroom_count: number;
  floor_area_sqm: number | null;
  has_pool: boolean;
  has_parking: boolean;
  has_terrace: boolean;
  current_use: string | null;
  availability_notes: string | null;
  additional_notes: string | null;
  estimated_revenue_low: string | null;
  estimated_revenue_high: string | null;
  estimated_occupancy: number | null;
  propertize_fee: string | null;
  analysis_notes: string | null;
  analysis_file_url: string | null;
  status: string;
  submitted_at: string;
  completed_at: string | null;
  sent_at: string | null;
  token: string;
  lead: { id: string; first_name: string; last_name: string } | null;
}

// --- Hooks ---

export function useAnalyses(status?: string) {
  const qs = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: ["analyses", status],
    queryFn: () => fetchJson<AnalysisListItem[]>(`/api/analysis${qs}`),
  });
}

export function useAnalysis(id: string) {
  return useQuery({
    queryKey: ["analyses", id],
    queryFn: () => fetchJson<AnalysisListItem>(`/api/analysis/${id}`),
    enabled: !!id,
  });
}

export function useUpdateAnalysis(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAnalysisInput) =>
      fetchJson<AnalysisListItem>(`/api/analysis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["analyses", id] });
    },
  });
}

export function useLinkAnalysisLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) =>
      fetchJson<AnalysisListItem>(`/api/analysis/${id}/link-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["analyses", id] });
    },
  });
}

// Public submit — does NOT use fetchJson (no auth token needed)
export function useSubmitAnalysis() {
  return useMutation({
    mutationFn: async (data: SubmitAnalysisInput & { lead_id?: string }) => {
      const { lead_id, ...body } = data;
      const qs = lead_id ? `?lead_id=${lead_id}` : "";
      const base = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${base}/api/analysis/submit${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Errore di rete");
      return json as { success: boolean; token: string };
    },
  });
}
