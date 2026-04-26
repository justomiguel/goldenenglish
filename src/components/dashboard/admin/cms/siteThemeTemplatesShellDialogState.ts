import type { SiteThemeActionErrorCode } from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";
import type { SiteThemeRow } from "@/types/theming";
import type { SiteThemeDialogKind } from "./siteThemeDialogPresentation";

export interface SiteThemeTemplatesShellDialogState {
  kind: SiteThemeDialogKind;
  target?: SiteThemeRow;
  errorCode?: SiteThemeActionErrorCode | null;
}
