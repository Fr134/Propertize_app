import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { CreateLeadInput, UpdateLeadInput, CreateCallInput } from "@/lib/validators";

// --- Types ---

interface LeadListItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
  source: string;
  property_address: string | null;
  property_type: string | null;
  estimated_rooms: number | null;
  created_at: string;
  updated_at: string;
  converted_at: string | null;
  owner_id: string | null;
  _count: { calls: number };
  owner: { id: string; name: string } | null;
}

interface CallItem {
  id: string;
  lead_id: string;
  notes: string;
  called_at: string;
  created_by: string;
}

interface LeadDetail extends Omit<LeadListItem, "_count"> {
  calls: CallItem[];
  owner: { id: string; name: string } | null;
}

// --- Hooks ---

export function useLeads(status?: string) {
  const qs = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: ["leads", status],
    queryFn: () => fetchJson<LeadListItem[]>(`/api/crm/leads${qs}`),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ["leads", id],
    queryFn: () => fetchJson<LeadDetail>(`/api/crm/leads/${id}`),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeadInput) =>
      fetchJson<LeadListItem>("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLeadInput) =>
      fetchJson<LeadListItem>(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", id] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/crm/leads/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useCreateCall(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCallInput) =>
      fetchJson<CallItem>(`/api/crm/leads/${leadId}/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useConvertLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson<{ owner_id: string; owner_name: string }>(
        `/api/crm/leads/${id}/convert`,
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", id] });
      queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
  });
}

export type { LeadListItem, LeadDetail, CallItem };
