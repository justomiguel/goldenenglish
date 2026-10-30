"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { CentroListoLogoMark } from "@/components/organisms/pulsar/CentroListoLogoMark";
import { PulsarSessionMenu } from "@/components/organisms/pulsar/PulsarSessionMenu";
import type { Dictionary } from "@/types/i18n";

function AccountBar({
  locale,
  dict,
  email,
  showSignIn,
}: {
  locale: string;
  dict: Dictionary;
  email: string | null;
  showSignIn: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-16 max-w-xl items-center justify-between gap-3 px-5">
      <Link href={`/${locale}`} className="inline-flex min-h-11 items-center" aria-label={dict.pulsar.meta.brandName}>
        <CentroListoLogoMark size="sm" />
      </Link>
      {email || showSignIn ? (
        <PulsarSessionMenu locale={locale} email={email} copy={dict.pulsar.session} />
      ) : null}
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
  const showSignIn = !onAuthForm;

  return (
    <SurfaceMountGate
      skeleton={
        <div className="min-h-dvh bg-[var(--color-background)] text-[var(--color-foreground)]">
          <header className="border-b border-[var(--color-border)]">
            <AccountBar locale={locale} dict={dict} email={email} showSignIn={showSignIn} />
          </header>
          {children}
        </div>
      }
      desktop={
        <div className="min-h-dvh bg-[var(--color-background)] text-[var(--color-foreground)]">
          <header className="border-b border-[var(--color-border)]">
            <AccountBar locale={locale} dict={dict} email={email} showSignIn={showSignIn} />
          </header>
          {children}
        </div>
      }
      narrow={() => (
        <div className="min-h-dvh bg-[var(--color-background)] text-[var(--color-foreground)]">
          <header
            className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-background)]"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            <AccountBar locale={locale} dict={dict} email={email} showSignIn={showSignIn} />
          </header>
          <div style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>{children}</div>
        </div>
      )}
    />
  );
}
