export type IndicatorKey =
  | "attendance"
  | "newcomers"
  | "salvationDecisions"
  | "churchIntegration"
  | "tribeIntegration"
  | "servants";

export type VariationResult = {
  absolute: number | null;
  percentage: number | null;
  label: "first" | "stable" | "up" | "down";
};

export function computeVariation(
  current: number,
  previous: number | null
): VariationResult {
  if (previous === null) {
    return { absolute: null, percentage: null, label: "first" };
  }

  const absolute = current - previous;

  if (absolute === 0) {
    return { absolute: 0, percentage: 0, label: "stable" };
  }

  const percentage = previous === 0 ? null : (absolute / previous) * 100;
  return {
    absolute,
    percentage,
    label: absolute > 0 ? "up" : "down",
  };
}

export const INDICATOR_LABELS: Record<IndicatorKey, string> = {
  attendance: "Présences aux cultes",
  newcomers: "Nouveaux",
  salvationDecisions: "Décisions pour Jésus",
  churchIntegration: "Intégrations église",
  tribeIntegration: "Intégrations tribus",
  servants: "Serviteurs",
};
