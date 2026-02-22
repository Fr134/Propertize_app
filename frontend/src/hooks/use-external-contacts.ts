import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { CreateExternalContactInput } from "@/lib/validators";

export interface ExternalContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  category: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export function useExternalContacts(category?: string) {
  return useQuery({
    queryKey: ["external-contacts", category ?? "all"],
    queryFn: () => {
      const qs = category ? `?category=${category}` : "";
      return fetchJson<ExternalContact[]>(`/api/external-contacts${qs}`);
    },
  });
}

export function useCreateExternalContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExternalContactInput) =>
      fetchJson<ExternalContact>("/api/external-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-contacts"] });
    },
  });
}

export function useUpdateExternalContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExternalContactInput> }) =>
      fetchJson(`/api/external-contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-contacts"] });
    },
  });
}

export function useDeleteExternalContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/external-contacts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-contacts"] });
    },
  });
}
