import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";

// --- Types ---

export interface AuthorizationFormData {
  id: string;
  owner_id: string;
  token: string;
  location: string;
  submitted_at: string | null;
  created_at: string;
  owner_name?: string;

  cognome?: string | null;
  nome?: string | null;
  nato_a?: string | null;
  nato_prov?: string | null;
  nato_il?: string | null;
  codice_fiscale?: string | null;
  residente_a?: string | null;
  residente_cap?: string | null;
  indirizzo_res?: string | null;
  telefono?: string | null;
  email?: string | null;
  pec?: string | null;
  ruolo?: string | null;
  immobile_via?: string | null;
  immobile_n?: string | null;
  immobile_indirizzo?: string | null;
  immobile_n2?: string | null;
  immobile_piano?: string | null;
  immobile_comune?: string | null;
  immobile_cap?: string | null;
  immobile_prov?: string | null;
  sezione?: string | null;
  foglio?: string | null;
  particella?: string | null;
  sub?: string | null;
  categoria?: string | null;
  denominazione?: string | null;
  n_camere?: number | null;
  n_bagni?: number | null;
  n_posti_letto?: number | null;
  periodo_disponibilita?: string | null;
  luogo_data?: string | null;
}

export interface GeneratedDocumentData {
  id: string;
  generated_url: string;
  generated_at: string;
  sent_to_client_at: string | null;
  template: {
    label: string;
    location: string;
    document_type: string;
  };
}

export interface AuthorizationFormWithDocs extends AuthorizationFormData {
  documents: GeneratedDocumentData[];
}

// --- Public fetch (no auth) ---

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

// --- Public hooks ---

export function useAuthFormByToken(token: string) {
  return useQuery({
    queryKey: ["authorization-form", token],
    queryFn: () =>
      publicFetch<AuthorizationFormData>(`/api/authorizations/token/${token}`),
    enabled: !!token,
    retry: false,
  });
}

export function useSaveAuthForm(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      publicFetch<{ saved: boolean }>(`/api/authorizations/token/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorization-form", token] });
    },
  });
}

export function useSubmitAuthForm(token: string) {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      publicFetch<{ success: boolean; pdf_generated?: boolean }>(
        `/api/authorizations/token/${token}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      ),
  });
}

// --- Manager hooks (authenticated) ---

export function useAuthFormByOwner(ownerId: string) {
  return useQuery({
    queryKey: ["authorization-form-owner", ownerId],
    queryFn: () =>
      fetchJson<AuthorizationFormWithDocs>(`/api/authorizations/${ownerId}`),
    enabled: !!ownerId,
    retry: false,
  });
}

export function useSendAuthLink(ownerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson<{ token: string; url: string }>(
        `/api/authorizations/send-link/${ownerId}`,
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorization-form-owner", ownerId] });
    },
  });
}

export function useSendToClient(ownerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson<{ success: boolean }>(
        `/api/authorizations/${ownerId}/send-to-client`,
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorization-form-owner", ownerId] });
    },
  });
}

// --- PDF Templates hooks ---

export function usePdfTemplates() {
  return useQuery({
    queryKey: ["pdf-templates"],
    queryFn: () =>
      fetchJson<Record<string, Array<{
        id: string;
        location: string;
        document_type: string;
        label: string;
        template_url: string;
        is_active: boolean;
      }>>>("/api/pdf-templates"),
  });
}

export function useUpsertPdfTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      location: string;
      document_type: string;
      label: string;
      template_url: string;
    }) =>
      fetchJson("/api/pdf-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-templates"] });
    },
  });
}
