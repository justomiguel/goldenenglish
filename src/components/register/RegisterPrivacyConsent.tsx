import Link from "next/link";
import { privacyPagePath } from "@/lib/privacy/privacyPagePath";
import { splitPrivacyConsentLabel } from "@/lib/privacy/splitPrivacyConsentLabel";

interface RegisterPrivacyConsentProps {
  locale: string;
  label: string;
  linkLabel: string;
}

export function RegisterPrivacyConsent({
  locale,
  label,
  linkLabel,
}: RegisterPrivacyConsentProps) {
  const { before, after } = splitPrivacyConsentLabel(label);
  return (
    <label className="flex items-start gap-2 text-sm text-[var(--color-foreground)]">
      <input
        type="checkbox"
        name="privacy_accepted"
        value="yes"
        required
        className="mt-1"
      />
      <span>
        {before}
        <Link
          href={privacyPagePath(locale)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-current/40 underline-offset-2 hover:decoration-current"
          onClick={(event) => event.stopPropagation()}
        >
          {linkLabel}
        </Link>
        {after}
      </span>
    </label>
  );
}
