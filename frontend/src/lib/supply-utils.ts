type SupplyLevel = "OK" | "IN_ESAURIMENTO" | "ESAURITO";

/** Derive display level from qty_current vs thresholds */
export function deriveLevel(item: { qty_current: number; low_threshold: number }): SupplyLevel {
  if (item.qty_current <= 0) return "ESAURITO";
  if (item.qty_current <= item.low_threshold) return "IN_ESAURIMENTO";
  return "OK";
}
