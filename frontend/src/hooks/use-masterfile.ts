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

export interface ApplianceItem {
  type: string;
  brand?: string;
  model?: string;
  serial?: string;
  photo_url?: string;
  purchase_year?: number | null;
  warranty_expiry?: string;
  manual_url?: string;
  notes?: string;
}

export interface CustomerCareQAItem {
  question: string;
  answer?: string;
}

export interface DocumentItem {
  label: string;
  file_url?: string;
  uploaded_at?: string;
}

export interface RequiredPhotoItem {
  label: string;
  photo_url?: string;
  uploaded_at?: string;
}

export interface AcRemotePhotoItem {
  label?: string;
  photo_url?: string;
}

export interface Masterfile {
  id: string;
  property_id: string;
  // Legacy
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
  // Section 1
  maps_coordinates: string | null;
  maps_link: string | null;
  building_entry_name: string | null;
  building_directions: string | null;
  parking_info: string | null;
  ztl_zone: boolean | null;
  ztl_details: string | null;
  // Section 2
  access_type: string | null;
  lockbox_position: string | null;
  lockbox_code: string | null;
  lockbox_photo_url: string | null;
  smart_lock_model: string | null;
  spare_keys_location: string | null;
  door_blocked_procedure: string | null;
  access_emergency_contact: string | null;
  // Section 3 — Electricity
  electricity_meter_location: string | null;
  electricity_meter_photo_url: string | null;
  electricity_panel_location: string | null;
  electricity_panel_photo_url: string | null;
  electricity_power_kw: number | null;
  electricity_provider: string | null;
  electricity_client_number: string | null;
  electricity_reset_procedure: string | null;
  // Section 3 — Gas
  gas_meter_location_detail: string | null;
  gas_meter_photo_url: string | null;
  gas_valve_location: string | null;
  gas_provider: string | null;
  gas_client_number: string | null;
  gas_emergency_contact: string | null;
  // Section 3 — Water
  water_meter_location: string | null;
  water_meter_photo_url: string | null;
  water_shutoff_location: string | null;
  water_autoclave: boolean | null;
  water_autoclave_location: string | null;
  condo_manager_name: string | null;
  condo_manager_phone: string | null;
  // Section 4
  wifi_provider: string | null;
  wifi_contract_number: string | null;
  wifi_modem_serial: string | null;
  wifi_line_type: string | null;
  wifi_sim_number: string | null;
  wifi_ssid: string | null;
  wifi_password: string | null;
  wifi_modem_photo_url: string | null;
  wifi_modem_location: string | null;
  wifi_restart_procedure: string | null;
  wifi_support_number: string | null;
  // Section 6
  heating_type: string | null;
  boiler_brand: string | null;
  boiler_model: string | null;
  boiler_location: string | null;
  boiler_last_service: string | null;
  boiler_technician_name: string | null;
  boiler_technician_phone: string | null;
  boiler_reset_procedure: string | null;
  thermostat_model: string | null;
  thermostat_location: string | null;
  ac_guest_instructions: string | null;
  // Section 8
  fire_extinguisher_location: string | null;
  fire_extinguisher_expiry: string | null;
  smoke_detector_location: string | null;
  gas_detector_location: string | null;
  first_aid_location: string | null;
  condo_emergency_number: string | null;
  emergency_exits: string | null;
  electric_shutters_manual: string | null;
  // Section 9
  supplier_plumber_name: string | null;
  supplier_plumber_phone: string | null;
  supplier_electrician_name: string | null;
  supplier_electrician_phone: string | null;
  supplier_boiler_name: string | null;
  supplier_boiler_phone: string | null;
  supplier_locksmith_name: string | null;
  supplier_locksmith_phone: string | null;
  supplier_cleaning_name: string | null;
  supplier_cleaning_phone: string | null;
  supplier_intervention_number: string | null;
  // JSONB
  appliances: ApplianceItem[] | null;
  waste_info: Record<string, unknown> | null;
  inventory_info: Record<string, unknown> | null;
  customer_care_qa: CustomerCareQAItem[] | null;
  documents: DocumentItem[] | null;
  required_photos: RequiredPhotoItem[] | null;
  ac_remotes_photos: AcRemotePhotoItem[] | null;
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
    retry: false,
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
