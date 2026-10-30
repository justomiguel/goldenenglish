import Link from "next/link";
import { CentroListoLogoMark } from "@/components/organisms/pulsar/CentroListoLogoMark";
import { PulsarSessionMenu } from "@/components/organisms/pulsar/PulsarSessionMenu";
import type { Dictionary } from "@/types/i18n";

export function PulsarAdminChrome({
  locale,
  dict,
  email,
  extra = null,
  children,
}: {
  locale: string;
  dict: Dictionary;
  email: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header
        className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href={`/${locale}`} className="inline-flex min-h-11 items-center" aria-label={dict.pulsar.meta.brandName}>
            <CentroListoLogoMark size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            {extra}
            <PulsarSessionMenu locale={locale} email={email} copy={dict.pulsar.session} />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
