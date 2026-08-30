import type { JoinBillingYearMonth } from "@/lib/billing/planJoinBillingMonths";

const MONTH_ABBR: Record<"es" | "en" | "pt", readonly string[]> = {
  es: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  pt: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
};

export type JoinBillingPreviewLabels = {
  exempt: string;
  paid: string;
  due: string;
  scholarship: string;
  nonePrior: string;
};

function abbr(locale: string, month: number): string {
  const table = locale === "en" || locale === "pt" ? MONTH_ABBR[locale] : MONTH_ABBR.es;
  return table[month - 1] ?? String(month);
}

function joinLabel(
  kind: "current" | "behind" | "scholarship",
  labels: JoinBillingPreviewLabels,
): string {
  if (kind === "current") return labels.paid;
  if (kind === "behind") return labels.due;
  return labels.scholarship;
}

export function formatJoinBillingPreview(input: {
  locale: string;
  priorMonths: JoinBillingYearMonth[];
  joinMonth: JoinBillingYearMonth;
  joinIsBillable: boolean;
  dispositionKind: "current" | "behind" | "scholarship";
  labels: JoinBillingPreviewLabels;
}): string {
  const joinText = `${abbr(input.locale, input.joinMonth.month)}: ${joinLabel(input.dispositionKind, input.labels)}`;
  if (!input.joinIsBillable) return joinText;
  const prior = input.priorMonths;
  if (prior.length === 0) return joinText;
  const first = prior[0];
  const last = prior[prior.length - 1];
  const range =
    first.year === last.year && first.month === last.month
      ? abbr(input.locale, first.month)
      : `${abbr(input.locale, first.month)}–${abbr(input.locale, last.month)}`;
  return `${range}: ${input.labels.exempt} · ${joinText}`;
}
