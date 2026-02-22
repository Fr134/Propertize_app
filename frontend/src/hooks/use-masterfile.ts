import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import type {
  MasterfileInput,
  UpdatePropertyOperationalInput,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
} from "@/lib/validators";

// ============================================
// Types
// ============================================

export interface PropertyOperational {
  id: string;
  name: string;
  code: string;
  wifi_network: string | null;
  wifi_password: string | null;
  door_code: string | null;
  alarm_code: string | null;
  gas_meter_location: string | null;
  water_shutoff: string | null;
  electricity_panel: string | null;
  trash_schedule: string | null;
  checkin_notes: string | null;
  checkout_notes: string | null;
  internal_notes: string | null;
  contract_url: string | null;
}

export interface Masterfile {
  id: string;
  property_id: string;
  plumber_name: string | null;
  plumber_phone: string | null;
  electrician_name: string | null;
  electrician_phone: string | null;
  cleaner_notes: string | null;
  cadastral_id: string | null;
  cie_code: string | null;
  tourism_license: string | null;
  custom_fields: { key: string; label: string; value: string }[] | null;
  cover_photo_url: string | null;
  floorplan_url: string | null;
  additional_photos: { url: string; caption: string | null }[] | null;
  drive_folder_url: string | null;
  updated_at: string;
  property: { name: string; code: string };
}

export interface InventoryItem {
  id: string;
  property_id: string;
  room: string;
  name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  warranty_expires: string | null;
  notes: string | null;
  photo_url: string | null;
  condition: "GOOD" | "DAMAGED" | "BROKEN" | "REPLACED";
  created_at: string;
  updated_at: string;
}

export interface InventoryGroup {
  room: string;
  items: InventoryItem[];
}

// ============================================
// Hooks — Operational
// ============================================

export function usePropertyOperational(propertyId: string) {
  return useQuery({
    queryKey: ["property-masterfile", propertyId, "operational"],
    queryFn: () =>
      fetchJson<PropertyOperational>(`/api/masterfile/${propertyId}/operational`),
    enabled: !!propertyId,
  });
}

export function useUpdatePropertyOperational(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePropertyOperationalInput) =>
      fetchJson(`/api/masterfile/${propertyId}/operational`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["property-masterfile", propertyId],
      });
    },
  });
}

// ============================================
// Hooks — Masterfile
// ============================================

export function useMasterfile(propertyId: string) {
  return useQuery({
    queryKey: ["property-masterfile", propertyId],
    queryFn: () => fetchJson<Masterfile>(`/api/masterfile/${propertyId}`),
    enabled: !!propertyId,
    retry: false, // 404 is expected if masterfile doesn't exist yet
  });
}

export function useUpdateMasterfile(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MasterfileInput>) =>
      fetchJson(`/api/masterfile/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["property-masterfile", propertyId],
      });
    },
  });
}

// ============================================
// Hooks — Inventory
// ============================================

export function usePropertyInventory(propertyId: string) {
  return useQuery({
    queryKey: ["property-inventory", propertyId],
    queryFn: () =>
      fetchJson<InventoryGroup[]>(`/api/masterfile/${propertyId}/inventory`),
    enabled: !!propertyId,
  });
}

export function useCreateInventoryItem(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInventoryItemInput) =>
      fetchJson(`/api/masterfile/${propertyId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["property-inventory", propertyId],
      });
    },
  });
}

export function useUpdateInventoryItem(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: UpdateInventoryItemInput;
    }) =>
      fetchJson(`/api/masterfile/${propertyId}/inventory/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["property-inventory", propertyId],
      });
    },
  });
}

export function useDeleteInventoryItem(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      fetchJson(`/api/masterfile/${propertyId}/inventory/${itemId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["property-inventory", propertyId],
      });
    },
  });
}
