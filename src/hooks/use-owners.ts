import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { CreateOwnerInput, UpdateOwnerInput } from "@/lib/validators";

// --- Types ---

interface OwnerListItem {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
  _count: { properties: number };
}

// --- Hooks ---

export function useOwners() {
  return useQuery({
    queryKey: ["owners"],
    queryFn: () => fetchJson<OwnerListItem[]>("/api/owners"),
  });
}

export function useCreateOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOwnerInput) =>
      fetchJson<OwnerListItem>("/api/owners", {
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
      fetchJson(`/api/owners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
  });
}

export type { OwnerListItem };
