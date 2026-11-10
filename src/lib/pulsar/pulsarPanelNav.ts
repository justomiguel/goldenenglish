import type { Dictionary } from "@/types/i18n";

export type PulsarPanelRole = "staff" | "owner";

export type PulsarPanelNavItem = {
  id: string;
  href: string;
  label: string;
};

export type PulsarPanelNav = {
  panelLabel: string;
  openMenu: string;
  navAria: string;
  panel: PulsarPanelNavItem[];
};

function panelItem(id: string, href: string, label: string): PulsarPanelNavItem {
  return { id, href, label };
}

export function buildPulsarPanelNav(input: {
  locale: string;
  role: PulsarPanelRole;
  dict: Dictionary;
}): PulsarPanelNav {
  const { locale, role, dict } = input;
  const copy = dict.pulsar.panelNav;
  const admin = `/${locale}/admin`;
  const panel =
    role === "staff"
      ? [
          panelItem("sites", `${admin}?tab=sites`, dict.pulsar.admin.tabSites),
          panelItem("accounts", `${admin}?tab=accounts`, dict.pulsar.admin.tabAccounts),
          panelItem("mail", `${admin}?tab=mail`, dict.pulsar.admin.tabMail),
          panelItem("analytics", `${admin}?tab=analytics`, dict.pulsar.admin.tabAnalytics),
          panelItem("operator", `${admin}?tab=operator`, dict.pulsar.admin.tabOperator),
          panelItem("templates", `${admin}/plantillas`, dict.pulsar.admin.templatesNav),
          panelItem("new", `${admin}/tenants/new`, dict.pulsar.admin.newTenantCta),
          panelItem("profile", `/${locale}/admin/perfil`, dict.pulsar.panelNav.account),
        ]
      : [
          panelItem("sites", `/${locale}/cuenta`, dict.pulsar.account.homeTitle),
          panelItem("templates", `/${locale}/cuenta/plantillas`, dict.pulsar.admin.templatesNav),
          panelItem("new", `/${locale}/cuenta/nuevo`, dict.pulsar.account.create),
          panelItem("messages", `/${locale}/cuenta/mensajes`, dict.pulsar.panelNav.messages),
          panelItem("profile", `/${locale}/cuenta/perfil`, dict.pulsar.panelNav.account),
        ];
  return {
    panelLabel: copy.panel,
    openMenu: copy.openMenu,
    navAria: copy.navAria,
    panel,
  };
}

function hrefPath(href: string): string {
  return href.split("?")[0] ?? href;
}

export function isPulsarPanelItemActive(
  item: PulsarPanelNavItem,
  pathname: string,
  tab: string | null,
): boolean {
  const path = hrefPath(item.href);
  if (item.id === "new") return pathname === path;
  if (path.endsWith("/admin")) {
    if (pathname !== path) return false;
    if (item.id === "sites") return tab === null || tab === "" || tab === "sites";
    return tab === item.id;
  }
  return pathname === path;
}
