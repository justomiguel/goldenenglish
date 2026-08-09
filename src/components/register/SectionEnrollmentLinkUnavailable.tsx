import Link from "next/link";
import { Home, LinkIcon } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

interface SectionEnrollmentLinkUnavailableProps {
  locale: string;
  labels: Dictionary["register"]["sectionLink"];
}

/**
 * Shown instead of a 404 whenever the token cannot be resolved: unknown, malformed,
 * rotated, deactivated or archived. The reasons are deliberately indistinguishable
 * so a visitor cannot probe which tokens exist.
 */
export function SectionEnrollmentLinkUnavailable({
  locale,
  labels,
}: SectionEnrollmentLinkUnavailableProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <LinkIcon
        className="h-10 w-10 text-[var(--color-muted-foreground)]"
        aria-hidden
      />
      <h1 className="mt-4 text-2xl font-semibold text-[var(--color-foreground)]">
        {labels.unavailableTitle}
      </h1>
      <p className="mt-3 text-[var(--color-muted-foreground)]">
        {labels.unavailableClosed}
      </p>
      <Link
        href={`/${locale}`}
        className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
      >
        <Home className="h-4 w-4 shrink-0" aria-hidden />
        {labels.backHome}
      </Link>
    </main>
  );
}
