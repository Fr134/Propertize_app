import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreatePropertyInput, UpdateChecklistTemplateInput } from "@/lib/validators";
import { fetchJson, type PaginatedResponse } from "@/lib/fetch";

export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const res = await fetchJson<PaginatedResponse<PropertyListItem>>("/api/properties");
      return res.data;
    },
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ["properties", id],
    queryFn: () => fetchJson<PropertyDetail>(`/api/properties/${id}`),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePropertyInput) =>
      fetchJson("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
  });
}

export function useUpdateChecklist(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateChecklistTemplateInput) =>
      fetchJson(`/api/properties/${propertyId}/checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties", propertyId] });
    },
  });
}

// Types matching Prisma response
interface PropertyListItem {
  id: string;
  name: string;
  code: string;
  address: string;
  property_type: string;
  created_at: string;
  _count: { tasks: number };
  owner: { id: string; name: string } | null;
}

interface ChecklistTemplate {
  id: string;
  property_id: string;
  // New format: { items: [...], staySupplies: [...] }
  // Old format (backward compat): plain array
  items: unknown;
}

interface PropertyDetail {
  id: string;
  name: string;
  code: string;
  address: string;
  property_type: string;
  checklist_template: ChecklistTemplate | null;
  linen_inventory: { id: string; type: string; status: string; quantity: number }[];
}

export type { PropertyListItem, PropertyDetail, ChecklistTemplate };
