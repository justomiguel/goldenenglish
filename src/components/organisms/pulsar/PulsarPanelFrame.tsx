"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { CentroListoLogoMark } from "@/components/organisms/pulsar/CentroListoLogoMark";
import { PulsarPanelNavLinks } from "@/components/organisms/pulsar/PulsarPanelNavLinks";
import { PulsarSessionMenu } from "@/components/organisms/pulsar/PulsarSessionMenu";
import { PulsarSidebarIdentity } from "@/components/organisms/pulsar/PulsarSidebarIdentity";
import { buildPulsarPanelNav, type PulsarPanelRole } from "@/lib/pulsar/pulsarPanelNav";
import type { Dictionary } from "@/types/i18n";

export function PulsarPanelFrame({
  locale,
  dict,
  email,
  displayName = "",
  phone = "",
  avatarUrl = null,
  role,
  extra = null,
  children,
}: {
  locale: string;
  dict: Dictionary;
  email: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string | null;
  role: PulsarPanelRole;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = params.get("tab");
  const nav = buildPulsarPanelNav({ locale, role, dict });
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleName = displayName.trim() || email.split("@")[0] || email;
  const profileHref = role === "staff" ? `/${locale}/admin/perfil` : `/${locale}/cuenta/perfil`;
  const identity = (
    <PulsarSidebarIdentity
      name={visibleName}
      email={email}
      phone={phone}
      avatarUrl={avatarUrl}
      profileHref={profileHref}
    />
  );
  const signOut = (
    <div
      className="shrink-0 border-t border-[var(--color-border)] px-3 py-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <PulsarSessionMenu locale={locale} email={email} copy={dict.pulsar.session} />
    </div>
  );

  const links = (
    <nav aria-label={nav.navAria} className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      <PulsarPanelNavLinks label={nav.panelLabel} items={nav.panel} pathname={pathname} tab={tab} />
    </nav>
  );

  const desktop = (
    <div className="flex min-h-dvh bg-[var(--color-background)] text-[var(--color-foreground)]">
      <aside className="sticky top-0 flex h-dvh w-72 shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-background)]">
        <div className="px-4 py-4">
          <Link href={`/${locale}`} className="inline-flex min-h-11 items-center" aria-label={dict.pulsar.meta.brandName}>
            <CentroListoLogoMark size="sm" />
          </Link>
        </div>
        {identity}
        {links}
        {signOut}
      </aside>
      <div className="min-w-0 flex-1 overflow-y-auto">
        {extra ? <div className="flex justify-end px-4 py-3">{extra}</div> : null}
        {children}
      </div>
    </div>
  );

  const narrow = (
    <div className="flex min-h-dvh flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header
        className="flex min-h-14 items-center justify-between gap-3 border-b border-[var(--color-border)] px-4"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <Link href={`/${locale}`} className="inline-flex min-h-11 items-center" aria-label={dict.pulsar.meta.brandName}>
          <CentroListoLogoMark size="sm" />
        </Link>
        <Button type="button" variant="ghost" className="min-h-11" onClick={() => setMenuOpen(true)}>
          <Menu className="h-4 w-4" aria-hidden />
          {nav.openMenu}
        </Button>
      </header>
      {extra ? <div className="flex justify-end px-4 py-3">{extra}</div> : null}
      <div className="min-h-0 flex-1">{children}</div>
      <Modal
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title={nav.panelLabel}
        titleId="pulsar-panel-menu"
      >
        <div className="flex max-h-[70vh] flex-col">
          {identity}
          <div className="min-h-0 flex-1 overflow-y-auto">{links}</div>
          {signOut}
        </div>
      </Modal>
    </div>
  );

  return (
    <SurfaceMountGate
      skeleton={desktop}
      desktop={desktop}
      narrow={() => narrow}
    />
  );
}
