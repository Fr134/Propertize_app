import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type { UpdateLinenInput } from "@/lib/validators";

interface LinenItem {
  id: string;
  property_id: string;
  type: string;
  status: string;
  quantity: number;
}

export function usePropertyLinen(propertyId: string) {
  return useQuery({
    queryKey: ["linen", propertyId],
    queryFn: () => fetchJson<LinenItem[]>(`/api/properties/${propertyId}/linen`),
    enabled: !!propertyId,
  });
}

export function useUpdateLinen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLinenInput) =>
      fetchJson("/api/linen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linen"] });
    },
  });
}

export type { LinenItem };
