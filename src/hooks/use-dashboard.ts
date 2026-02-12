import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";

// --- Types ---

interface ManagerDashboardKPI {
  pendingApprovalCount: number;
  openReportsCount: number;
  lowSupplyPropertiesCount: number;
  todayTasksCompleted: number;
  todayTasksTotal: number;
}

// --- Hooks ---

export function useManagerDashboard() {
  return useQuery({
    queryKey: ["dashboard", "manager"],
    queryFn: () => fetchJson<ManagerDashboardKPI>("/api/dashboard/manager"),
    // Refresh ogni 30 secondi per dati aggiornati
    refetchInterval: 30000,
  });
}

export type { ManagerDashboardKPI };
