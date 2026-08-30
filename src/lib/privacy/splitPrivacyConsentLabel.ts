const TOKEN = "{privacyLink}";

export function splitPrivacyConsentLabel(label: string): {
  before: string;
  after: string;
} {
  const index = label.indexOf(TOKEN);
  if (index < 0) return { before: label, after: "" };
  return {
    before: label.slice(0, index),
    after: label.slice(index + TOKEN.length),
  };
}
