export const LEAD_STATUS_COLUMNS = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "PROPOSAL_SENT",
  "NEGOTIATING",
  "WON",
  "LOST",
] as const;

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "Nuovo",
  CONTACTED: "Contattato",
  INTERESTED: "Interessato",
  PROPOSAL_SENT: "Proposta inviata",
  NEGOTIATING: "In trattativa",
  WON: "Vinto",
  LOST: "Perso",
};

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manuale",
  REFERRAL: "Passaparola",
  SOCIAL: "Social",
  WEBSITE: "Sito web",
  OTHER: "Altro",
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-yellow-100 text-yellow-800",
  INTERESTED: "bg-orange-100 text-orange-800",
  PROPOSAL_SENT: "bg-purple-100 text-purple-800",
  NEGOTIATING: "bg-indigo-100 text-indigo-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-gray-100 text-gray-500",
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APPARTAMENTO: "Appartamento",
  VILLA: "Villa",
  ALTRO: "Altro",
};
