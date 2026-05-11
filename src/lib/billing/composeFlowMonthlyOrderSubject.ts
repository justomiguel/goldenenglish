import { truncateForFlowText } from "@/lib/billing/truncateFlowText";

const FLOW_SUBJECT_MAX = 240;

export function composeFlowMonthlyOrderSubject(input: {
  template: string;
  sectionName: string;
  periodLabel: string;
}): string {
  const raw = input.template
    .replaceAll("{sectionName}", input.sectionName)
    .replaceAll("{periodLabel}", input.periodLabel);
  return truncateForFlowText(raw, FLOW_SUBJECT_MAX);
}
