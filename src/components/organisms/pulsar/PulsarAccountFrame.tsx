"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { CentroListoLogoMark } from "@/components/organisms/pulsar/CentroListoLogoMark";
import { PulsarSessionMenu } from "@/components/organisms/pulsar/PulsarSessionMenu";
import type { Dictionary } from "@/types/i18n";

function AccountShell({
  locale,
  dict,
  email,
  showSignIn,
  sticky,
  children,
}: {
  locale: string;
  dict: Dictionary;
  email: string | null;
  showSignIn: boolean;
  sticky: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header
        className={`border-b border-[var(--color-border)] bg-[var(--color-background)] ${sticky ? "sticky top-0 z-30" : ""}`}
        style={sticky ? { paddingTop: "env(safe-area-inset-top, 0px)" } : undefined}
      >
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-5">
          <Link href={`/${locale}`} className="inline-flex min-h-11 items-center" aria-label={dict.pulsar.meta.brandName}>
            <CentroListoLogoMark size="md" />
          </Link>
          {email || showSignIn ? (
            <PulsarSessionMenu locale={locale} email={email} copy={dict.pulsar.session} />
          ) : null}
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-[var(--color-border)] py-10" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5">
          <CentroListoLogoMark size="sm" />
          <p className="max-w-md text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {dict.pulsar.meta.brandTagline}
          </p>
        </div>
      </footer>
    </div>
  );
}

export function PulsarAccountFrame({
  locale,
  dict,
  email,
  children,
}: {
  locale: string;
  dict: Dictionary;
  email: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const onAuthForm = pathname.includes("/cuenta/login") || pathname.includes("/cuenta/registro");
  if (onAuthForm) return <>{children}</>;
  const shell = (sticky: boolean) => (
    <AccountShell locale={locale} dict={dict} email={email} showSignIn sticky={sticky}>
      {children}
    </AccountShell>
  );

  return (
    <SurfaceMountGate
      skeleton={shell(false)}
      desktop={shell(false)}
      narrow={() => shell(true)}
    />
  );
}
