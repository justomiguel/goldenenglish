"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface AdminInitialSiteSetupGateProps {
  locale: string;
  needsSetup: boolean;
  redirectLabel: string;
  children: React.ReactNode;
}

export function AdminInitialSiteSetupGate({
  locale,
  needsSetup,
  redirectLabel,
  children,
}: AdminInitialSiteSetupGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const setupBase = `/${locale}/setup/first-run`;

  useEffect(() => {
    if (!needsSetup) return;
    if (!pathname) return;
    const onSetup =
      pathname === setupBase || pathname.startsWith(`${setupBase}/`);
    if (onSetup) return;
    router.replace(setupBase);
  }, [needsSetup, pathname, router, setupBase]);

  if (!needsSetup) return <>{children}</>;

  const onSetup =
    pathname === setupBase || pathname?.startsWith(`${setupBase}/`);
  if (!pathname || !onSetup) {
    return (
      <div
        className="flex min-h-[30vh] items-center justify-center text-sm text-[var(--color-muted-foreground)]"
        role="status"
        aria-live="polite"
      >
        {redirectLabel}
      </div>
    );
  }

  return <>{children}</>;
}
