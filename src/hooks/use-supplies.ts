import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { UpdateSupplyInput } from "@/lib/validators";

interface SupplyLevelItem {
  id: string;
  property_id: string;
  category: string;
  level: string;
  task_id: string | null;
}

interface LowSupplyItem extends SupplyLevelItem {
  property: { id: string; name: string; code: string };
}

export function usePropertySupplies(propertyId: string) {
  return useQuery({
    queryKey: ["supplies", propertyId],
    queryFn: () => fetchJson<SupplyLevelItem[]>(`/api/properties/${propertyId}/supplies`),
    enabled: !!propertyId,
  });
}

export function useLowSupplies() {
  return useQuery({
    queryKey: ["supplies", "low"],
    queryFn: () => fetchJson<LowSupplyItem[]>("/api/supplies/low"),
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

export type { SupplyLevelItem, LowSupplyItem };
