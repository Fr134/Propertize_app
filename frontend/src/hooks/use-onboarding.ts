import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";

// --- Types ---

export interface OnboardingListItem {
  id: string;
  owner_id: string;
  owner: { id: string; name: string; email: string | null; phone: string | null };
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  progress: { completed: number; total: number };
}

export interface OnboardingStepItem {
  id: string;
  workflow_id: string;
  step_key: string;
  label: string;
  description: string | null;
  status: string;
  order: number;
  completed_at: string | null;
  notes: string | null;
}

export interface OnboardingDetail {
  id: string;
  owner_id: string;
  owner: { id: string; name: string; email: string | null; phone: string | null };
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  steps: OnboardingStepItem[];
}

// --- Hooks ---

export function useOnboardingList(completed?: string) {
  const qs = completed ? `?completed=${completed}` : "";
  return useQuery({
    queryKey: ["onboarding", completed],
    queryFn: () => fetchJson<OnboardingListItem[]>(`/api/onboarding${qs}`),
  });
}

export function useOnboarding(ownerId: string) {
  return useQuery({
    queryKey: ["onboarding", ownerId],
    queryFn: () => fetchJson<OnboardingDetail>(`/api/onboarding/${ownerId}`),
    enabled: !!ownerId,
  });
}

export function useStartOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ownerId: string) =>
      fetchJson<OnboardingDetail>(`/api/onboarding/start/${ownerId}`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
    },
  });
}

export function useUpdateOnboardingStep(ownerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { stepKey: string; status?: string; notes?: string }) =>
      fetchJson<OnboardingStepItem>(
        `/api/onboarding/${ownerId}/steps/${data.stepKey}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: data.status,
            notes: data.notes,
          }),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", ownerId] });
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
    },
  });
}
