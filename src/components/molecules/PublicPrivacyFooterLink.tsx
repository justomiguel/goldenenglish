import Link from "next/link";
import { privacyPagePath } from "@/lib/privacy/privacyPagePath";

interface PublicPrivacyFooterLinkProps {
  locale: string;
  label: string;
  className?: string;
}

export function PublicPrivacyFooterLink({
  locale,
  label,
  className,
}: PublicPrivacyFooterLinkProps) {
  return (
    <Link href={privacyPagePath(locale)} className={className}>
      {label}
    </Link>
  );
}
