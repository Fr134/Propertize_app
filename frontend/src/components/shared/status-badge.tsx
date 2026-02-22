import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const taskStatusConfig: Record<string, { label: string; className: string }> = {
  TODO: { label: "Da fare", className: "bg-slate-100 text-slate-700 border-slate-200" },
  IN_PROGRESS: { label: "In corso", className: "bg-blue-100 text-blue-700 border-blue-200" },
  COMPLETED: { label: "Completato", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  APPROVED: { label: "Approvato", className: "bg-green-100 text-green-700 border-green-200" },
  REJECTED: { label: "Respinto", className: "bg-red-100 text-red-700 border-red-200" },
  DONE: { label: "Completato", className: "bg-green-100 text-green-700 border-green-200" },
};

const reportStatusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Aperta", className: "bg-red-100 text-red-700 border-red-200" },
  IN_PROGRESS: { label: "In corso", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  RESOLVED: { label: "Risolta", className: "bg-green-100 text-green-700 border-green-200" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  BASSA: { label: "Bassa", className: "bg-slate-100 text-slate-600 border-slate-200" },
  MEDIA: { label: "Media", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  ALTA: { label: "Alta", className: "bg-red-100 text-red-700 border-red-200" },
};

interface StatusBadgeProps {
  status: string;
  type?: "task" | "report" | "priority";
}

export function StatusBadge({ status, type = "task" }: StatusBadgeProps) {
  const configs = type === "task" ? taskStatusConfig : type === "report" ? reportStatusConfig : priorityConfig;
  const config = configs[status];

  if (!config) return <Badge variant="outline">{status}</Badge>;

  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
