import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OnboardingFileInput } from "@/lib/validators";

// --- Types ---

export interface OnboardingFileRoom {
  bed_type?: string;
  has_ac?: boolean;
}

export interface OnboardingFileBathroom {
  position?: string;
  amenities?: string[];
}

export interface OnboardingFileData {
  id: string;
  token: string;
  owner_id: string;
  status: "DRAFT" | "SUBMITTED";
  owner?: { id: string; name: string };

  // All form fields (optional)
  num_owners?: string | null;
  title_property?: string | null;
  property_type_description?: string | null;
  num_levels?: number | null;
  total_beds?: number | null;

  owner_first_name?: string | null;
  owner_last_name?: string | null;
  owner_fiscal_code?: string | null;
  billing_type?: string | null;
  owner_language?: string | null;
  owner_birth_date?: string | null;
  owner_phone?: string | null;
  owner_phone_alt?: string | null;
  owner_email?: string | null;
  owner_email_alt?: string | null;

  residence_address?: string | null;
  residence_zip?: string | null;
  residence_country?: string | null;

  document_type?: string | null;
  document_number?: string | null;
  document_issue_place?: string | null;
  document_issue_date?: string | null;
  document_file_url?: string | null;

  bank_account_holder?: string | null;
  bank_iban?: string | null;
  bank_name?: string | null;
  bank_bic_swift?: string | null;

  property_condition?: string | null;
  property_address?: string | null;
  property_zip?: string | null;
  property_floor?: string | null;
  property_intercom_name?: string | null;
  property_door_number?: string | null;
  property_sqm_internal?: number | null;
  property_sqm_external?: number | null;

  num_rooms?: number | null;
  rooms?: OnboardingFileRoom[] | null;
  has_sofa_bed?: boolean | null;

  num_bathrooms?: number | null;
  bathrooms?: OnboardingFileBathroom[] | null;

  num_kitchens?: number | null;
  kitchen_layout?: string | null;
  kitchen_type?: string | null;
  kitchen_amenities?: string[] | null;
  kitchen_extra?: string | null;
  kitchen_notes?: string | null;

  general_amenities?: string[] | null;
  internet_provider?: string | null;
  wifi_name?: string | null;
  wifi_password?: string | null;
  modem_sim_number?: string | null;
  modem_serial_number?: string | null;

  has_self_checkin_device?: boolean | null;
  self_checkin_code?: string | null;
  self_checkin_position?: string | null;
  self_checkin_photo_url?: string | null;

  has_parking?: boolean | null;
  parking_photo_url?: string | null;
  has_disabled_access?: boolean | null;

  services?: string[] | null;
  allows_pets?: boolean | null;
  other_services?: string | null;
  allows_smoking?: boolean | null;

  safety_equipment?: string[] | null;

  gas_tank_position?: string | null;
  gas_connection_type?: string | null;
  gas_photo_url?: string | null;
  electricity_internal_photo_url?: string | null;
  electricity_internal_position?: string | null;
  electricity_external_photo_url?: string | null;
  electricity_external_position?: string | null;
  water_internal_position?: string | null;
  water_internal_photo_url?: string | null;
  water_external_position?: string | null;
  water_external_photo_url?: string | null;

  planimetry_file_url?: string | null;
  cadastral_survey_file_url?: string | null;
  cin_file_url?: string | null;
  alloggiati_web_file_url?: string | null;
  ross1000_credentials?: string | null;

  has_waste_bins?: boolean | null;
  waste_calendar_photo_url?: string | null;
  waste_bins_location_photo_url?: string | null;
  waste_notes?: string | null;

  keys_availability_date?: string | null;
  dates_to_block?: string | null;
  privacy_consent?: boolean | null;

  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

// --- Direct fetch for public endpoints (no auth) ---

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "")
    : (process.env.API_URL ?? "");

async function publicFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Errore di rete");
  return data;
}

// --- Public hooks (token-based, no auth) ---

export function useOnboardingFileByToken(token: string) {
  return useQuery({
    queryKey: ["onboarding-file", token],
    queryFn: () =>
      publicFetch<OnboardingFileData>(`/api/onboarding-file/token/${token}`),
    enabled: !!token,
    retry: false,
  });
}

export function useSaveOnboardingFile(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<OnboardingFileInput>) =>
      publicFetch<OnboardingFileData>(`/api/onboarding-file/token/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["onboarding-file", token], updated);
    },
  });
}

export function useSubmitOnboardingFile(token: string) {
  return useMutation({
    mutationFn: () =>
      publicFetch<{ message: string }>(
        `/api/onboarding-file/token/${token}/submit`,
        { method: "POST" }
      ),
  });
}

// --- Manager hooks (authenticated) ---

export function useOnboardingFileByOwner(ownerId: string) {
  // Uses fetchJson which auto-attaches auth token
  return useQuery({
    queryKey: ["onboarding-file", "owner", ownerId],
    queryFn: async () => {
      const { fetchJson } = await import("@/lib/fetch");
      return fetchJson<OnboardingFileData>(
        `/api/onboarding-file/owner/${ownerId}`
      );
    },
    enabled: !!ownerId,
    retry: false,
  });
}

export function useCreateOnboardingFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ownerId: string) => {
      const { fetchJson } = await import("@/lib/fetch");
      return fetchJson<OnboardingFileData>(
        `/api/onboarding-file/create/${ownerId}`,
        { method: "POST" }
      );
    },
    onSuccess: (_, ownerId) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-file", "owner", ownerId] });
    },
  });
}
