import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { UpdateSupplyInput } from "@/lib/validators";
export { deriveLevel } from "@/lib/supply-utils";

// Matches GET /api/properties/:id/supplies response (PropertySupplyStock + supply_item)
interface PropertySupplyStockItem {
  id: string;
  property_id: string;
  supply_item_id: string;
  qty_current: number;
  qty_standard: number;
  low_threshold: number;
  updated_at: string;
  updated_by_task: string | null;
  supply_item: {
    name: string;
    unit: string;
  };
}

// Matches GET /api/supplies/low response
interface LowSupplyStockItem {
  id: string;
  property_id: string;
  supply_item_id: string;
  qty_current: number;
  low_threshold: number;
  property_name: string;
  property_code: string;
}

export function usePropertySupplies(propertyId: string) {
  return useQuery({
    queryKey: ["supplies", propertyId],
    queryFn: () => fetchJson<PropertySupplyStockItem[]>(`/api/properties/${propertyId}/supplies`),
    enabled: !!propertyId,
  });
}

export function useLowSupplies() {
  return useQuery({
    queryKey: ["supplies", "low"],
    queryFn: () => fetchJson<LowSupplyStockItem[]>("/api/supplies/low"),
  });
}

export function useUpdateSupplies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSupplyInput) =>
      fetchJson("/api/supplies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
    },
  });
}

export type { PropertySupplyStockItem, LowSupplyStockItem };
