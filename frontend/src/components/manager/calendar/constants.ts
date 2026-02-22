export const DAY_NAMES = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  DONE: "bg-green-100 text-green-700 border-green-200",
};

export const STATUS_LABELS: Record<string, string> = {
  TODO: "Da fare",
  IN_PROGRESS: "In corso",
  COMPLETED: "Completato",
  APPROVED: "Approvato",
  REJECTED: "Respinto",
  DONE: "Completato",
};

export const TASK_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  CLEANING: { label: "Pulizia", emoji: "\u{1F9F9}" },
  PREPARATION: { label: "Preparazione", emoji: "\u{1F3E0}" },
  MAINTENANCE: { label: "Manutenzione", emoji: "\u{1F527}" },
  INSPECTION: { label: "Ispezione", emoji: "\u{1F50D}" },
  KEY_HANDOVER: { label: "Consegna chiavi", emoji: "\u{1F5DD}\u{FE0F}" },
  OTHER: { label: "Altro", emoji: "\u{1F4CB}" },
};

export const MAX_CHIPS_MONTH = 3;
