type SupplyLevel = "OK" | "IN_ESAURIMENTO" | "ESAURITO";

/**
 * Convert an operator-reported supply level to a concrete qty_current value.
 * Uses the property's existing stock thresholds as reference.
 */
export function levelToQty(
  level: SupplyLevel,
  qtyStandard: number,
  lowThreshold: number,
): number {
  switch (level) {
    case "OK":
      return qtyStandard;
    case "IN_ESAURIMENTO":
      return lowThreshold;
    case "ESAURITO":
      return 0;
    default:
      return 0;
  }
}

/**
 * Derive a display level from current qty vs thresholds.
 * Mirror of frontend deriveLevel — kept in backend for shared logic.
 */
export function deriveLevel(qtyCurrent: number, lowThreshold: number): SupplyLevel {
  if (qtyCurrent <= 0) return "ESAURITO";
  if (qtyCurrent <= lowThreshold) return "IN_ESAURIMENTO";
  return "OK";
}
