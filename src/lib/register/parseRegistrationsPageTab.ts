export const REGISTRATIONS_PAGE_TABS = ["list", "config"] as const;

export type RegistrationsPageTab = (typeof REGISTRATIONS_PAGE_TABS)[number];

/** `config` opens the settings tab. Any other value opens the lead list. */
export function parseRegistrationsPageTab(raw: string | null | undefined): RegistrationsPageTab {
  return raw === "config" ? "config" : "list";
}
