import type { RegistrationFeeLine } from "@/lib/register/registrationFeeSnapshot";
import type { JoinPackageTuitionLine } from "@/lib/register/parseJoinPackageSnapshot";

export type JoinPackageCopyInput = {
  enrollment: { lines: RegistrationFeeLine[] };
  tuition: JoinPackageTuitionLine[];
  trialCreditApplied?: number;
};

export type JoinPackagePayCtaKind = "both" | "month" | "enrollment" | "none";

function enrollmentDue(input: JoinPackageCopyInput): number {
  return input.enrollment.lines.reduce((sum, line) => sum + Math.max(0, line.amount), 0);
}

function tuitionDue(input: JoinPackageCopyInput): number {
  return input.tuition.reduce((sum, line) => sum + Math.max(0, line.amount), 0);
}

export function formatMonthName(locale: string, year: number, month: number): string {
  return new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 15, 12, 0, 0)),
  );
}

export function formatJoinPackageBreakdown(
  input: JoinPackageCopyInput,
  locale: string,
  labels: { enrollment: string },
): string {
  const parts: string[] = [];
  if (enrollmentDue(input) > 0) parts.push(labels.enrollment);
  for (const line of input.tuition) {
    if (line.amount <= 0) continue;
    const name = formatMonthName(locale, line.year, line.month);
    if (!parts.includes(name)) parts.push(name);
  }
  return parts.join(" + ");
}

export function resolveJoinPackagePayCta(
  input: JoinPackageCopyInput,
  locale: string,
  labels: {
    both: string;
    month: string;
    enrollment: string;
  },
): string {
  const kind = joinPackagePayCtaKind(input);
  if (kind === "both") return labels.both;
  if (kind === "enrollment") return labels.enrollment;
  if (kind === "month") {
    const first = input.tuition.find((line) => line.amount > 0);
    const month = first ? formatMonthName(locale, first.year, first.month) : "";
    return labels.month.replace("{{month}}", month);
  }
  return labels.both;
}

export function joinPackagePayCtaKind(input: JoinPackageCopyInput): JoinPackagePayCtaKind {
  const enroll = enrollmentDue(input) > 0;
  const month = tuitionDue(input) > 0;
  if (enroll && month) return "both";
  if (month) return "month";
  if (enroll) return "enrollment";
  return "none";
}
