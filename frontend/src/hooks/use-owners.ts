import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { CreateOwnerInput, UpdateOwnerInput } from "@/lib/validators";

// --- Types ---

interface OwnerListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  _count: { properties: number };
}

interface OwnerProperty {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

interface OwnerDetail extends Omit<OwnerListItem, "_count"> {
  address: string | null;
  fiscal_code: string | null;
  iban: string | null;
  notes: string | null;
  contract_signed_at: string | null;
  properties: OwnerProperty[];
}

// --- Hooks ---

export function useOwners() {
  return useQuery({
    queryKey: ["owners"],
    queryFn: () => fetchJson<OwnerListItem[]>("/api/owners"),
  });
}

export function useOwner(id: string) {
  return useQuery({
    queryKey: ["owner", id],
    queryFn: () => fetchJson<OwnerDetail>(`/api/owners/${id}`),
    enabled: !!id,
  });
}

export function useCreateOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOwnerInput) =>
      fetchJson<OwnerDetail>("/api/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
  });
}

export function useUpdateOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOwnerInput }) =>
      fetchJson<OwnerDetail>(`/api/owners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      queryClient.invalidateQueries({ queryKey: ["owner", variables.id] });
    },
  });
}

export function useDeleteOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/owners/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
  });
}

export type { OwnerListItem, OwnerDetail, OwnerProperty };
