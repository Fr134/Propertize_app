import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";

// --- Types ---

export interface TeamMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "MANAGER" | "OPERATOR";
  phone: string | null;
  active: boolean;
  can_manage_leads: boolean;
  can_do_analysis: boolean;
  can_manage_operations: boolean;
  can_manage_finance: boolean;
  can_manage_team: boolean;
  can_manage_onboarding: boolean;
  is_super_admin: boolean;
  leads_assignment_count: number;
  analysis_assignment_count: number;
  operations_assignment_count: number;
  onboarding_assignment_count: number;
  created_at: string;
}

export interface InviteTeamMemberInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: "MANAGER" | "OPERATOR";
  phone?: string;
  can_manage_leads: boolean;
  can_do_analysis: boolean;
  can_manage_operations: boolean;
  can_manage_finance: boolean;
  can_manage_team: boolean;
  can_manage_onboarding: boolean;
}

export interface UpdateTeamMemberInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface UpdatePermissionsInput {
  can_manage_leads?: boolean;
  can_do_analysis?: boolean;
  can_manage_operations?: boolean;
  can_manage_finance?: boolean;
  can_manage_team?: boolean;
  can_manage_onboarding?: boolean;
}

// --- Hooks ---

export function useTeam() {
  return useQuery({
    queryKey: ["team"],
    queryFn: () => fetchJson<TeamMember[]>("/api/team"),
  });
}

export function useTeamMember(id: string) {
  return useQuery({
    queryKey: ["team", id],
    queryFn: () => fetchJson<TeamMember>(`/api/team/${id}`),
    enabled: !!id,
  });
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteTeamMemberInput) =>
      fetchJson<TeamMember>("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamMemberInput }) =>
      fetchJson<TeamMember>(`/api/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      queryClient.invalidateQueries({ queryKey: ["team", variables.id] });
    },
  });
}

export function useUpdatePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePermissionsInput }) =>
      fetchJson<TeamMember>(`/api/team/${id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      queryClient.invalidateQueries({ queryKey: ["team", variables.id] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      fetchJson(`/api/team/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      }),
  });
}

export function useDeactivateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/team/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}
