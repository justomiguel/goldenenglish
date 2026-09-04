import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { formatJoinPackageBreakdown } from "@/lib/register/formatJoinPackageCopy";
import { parseJoinPackageSnapshot } from "@/lib/register/parseJoinPackageSnapshot";
import type { RegistrationIntakeState } from "@/lib/register/registrationIntake";

export function formatRegistrationIntakeLabel(input: {
  intakeState: RegistrationIntakeState | undefined;
  requestedSectionFull?: boolean;
  proposedSectionName?: string;
  snapshotTotal?: number;
  snapshotCurrency?: string;
  feeSnapshot?: unknown;
  locale: string;
  labels: {
    awaitingFee: string;
    receiptPending: string;
    needsSection: string;
    sectionFull: string;
    offerPending: string;
    readyToEnrol: string;
    enrollmentKind: string;
  };
}): string | null {
  if (input.intakeState === "offer_pending") {
    return input.labels.offerPending.replace(
      "{{section}}",
      input.proposedSectionName?.trim() || "",
    );
  }
  if (input.requestedSectionFull || input.intakeState === "section_full") {
    return input.labels.sectionFull;
  }
  if (input.intakeState === "receipt_pending") return input.labels.receiptPending;
  if (input.intakeState === "needs_section") return input.labels.needsSection;
  if (input.intakeState === "awaiting_fee") {
    const parsed = parseJoinPackageSnapshot(input.feeSnapshot);
    const breakdown = formatJoinPackageBreakdown(parsed, input.locale, {
      enrollment: input.labels.enrollmentKind,
    });
    const amount = formatMoneyLabel(
      input.snapshotTotal ?? parsed.total,
      input.snapshotCurrency ?? parsed.currency,
      input.locale,
    );
    return input.labels.awaitingFee
      .replace("{{breakdown}}", breakdown)
      .replace("{{amount}}", amount);
  }
  if (input.intakeState === "none" && !(input.snapshotTotal ?? 0)) {
    return input.labels.readyToEnrol;
  }
  return null;
}
