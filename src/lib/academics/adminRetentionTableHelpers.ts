import type { AdminRetentionCandidate } from "@/lib/academics/loadAdminRetentionCandidates";
import type { Dictionary } from "@/types/i18n";

type RetentionDict = Dictionary["dashboard"]["adminRetention"];

export function buildRetentionSignals(row: AdminRetentionCandidate, dict: RetentionDict): string {
  const parts: string[] = [];
  if (row.reasons.includes("absences")) {
    parts.push(`${dict.reasonAbsences}: ${row.trailingAbsences}`);
  }
  if (row.reasons.includes("low_average")) {
    parts.push(
      `${dict.reasonLowAverage}: ${row.avgScore != null ? String(row.avgScore) : dict.avgMissing}`,
    );
  }
  return parts.join(" · ");
}

export function buildWhatsappTooltip(phoneDisplay: string, template: string): string {
  return template.replaceAll("{phone}", phoneDisplay);
}

export function buildEmailTooltip(email: string, template: string): string {
  return template.replaceAll("{email}", email);
}

export function buildWhatsappHref(
  row: AdminRetentionCandidate,
  brandAppName: string,
  dict: RetentionDict,
): string | null {
  if (!row.guardianPhoneDigits) return null;
  const signals = buildRetentionSignals(row, dict);
  const text = dict.whatsappMessage
    .replaceAll("{institute}", brandAppName)
    .replaceAll("{student}", row.studentLabel)
    .replaceAll("{section}", row.sectionName)
    .replaceAll("{signals}", signals);
  return `https://wa.me/${row.guardianPhoneDigits}?text=${encodeURIComponent(text)}`;
}

export function mapRetentionSendEmailErrorMessage(
  res: { ok: false; code: string; message?: string },
  dict: RetentionDict,
): string {
  if (res.message) {
    return dict.contactEmailFailReason.replaceAll("{reason}", res.message);
  }
  switch (res.code) {
    case "NO_EMAIL":
      return dict.contactEmailFailNoAddress;
    case "NO_LINK":
      return dict.contactEmailFailNoLink;
    case "NOT_FOUND":
      return dict.contactEmailFailStale;
    case "FORBIDDEN":
      return dict.contactEmailFailForbidden;
    case "PARSE":
      return dict.contactEmailFailParse;
    case "EMAIL_FAILED":
    case "SEND":
    default:
      return dict.contactEmailFail;
  }
}
