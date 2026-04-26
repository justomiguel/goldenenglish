import type { SiteThemeActionResult } from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";

export type SiteThemeRowConfirmState =
  | null
  | {
      run: () => Promise<SiteThemeActionResult>;
      title: string;
      description: string;
      confirmLabel: string;
      destructive?: boolean;
    };
