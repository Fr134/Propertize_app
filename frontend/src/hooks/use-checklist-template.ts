import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";

// V2 schema types matching checklistTemplateSchema
export interface SubTask {
  id: string;
  label: string;
  completed: boolean;
}

export interface ChecklistSupplyItem {
  supply_item_id: string;
  label: string;
  expected_qty: number;
}

export interface ChecklistArea {
  id: string;
  area: string;
  description: string;
  photo_required: boolean;
  sub_tasks: SubTask[];
  supply_items: ChecklistSupplyItem[];
}

interface TemplateResponse {
  items: ChecklistArea[];
}

export function useChecklistTemplate(propertyId: string) {
  return useQuery({
    queryKey: ["checklist-template", propertyId],
    queryFn: () =>
      fetchJson<TemplateResponse>(
        `/api/properties/${propertyId}/checklist-template`
      ),
    enabled: !!propertyId,
  });
}

export function useSaveChecklistTemplate(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ChecklistArea[]) =>
      fetchJson<TemplateResponse>(
        `/api/properties/${propertyId}/checklist-template`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-template", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["properties", propertyId] });
    },
  });
}
