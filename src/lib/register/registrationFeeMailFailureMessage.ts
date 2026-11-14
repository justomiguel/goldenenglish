export function registrationFeeMailFailureMessage(
  code: string,
  labels: {
    noAddress: string;
    noLink: string;
    failed: string;
    noFee: string;
    saveFailed: string;
    sectionFull: string;
    unknown: string;
  },
): string {
  if (code === "no_family_email") return labels.noAddress;
  if (code === "pay_link_missing") return labels.noLink;
  if (code === "mail_failed") return labels.failed;
  if (code === "no_fee") return labels.noFee;
  if (code === "save_failed") return labels.saveFailed;
  if (code === "section_full") return labels.sectionFull;
  return labels.unknown.replace("{{code}}", code);
}
