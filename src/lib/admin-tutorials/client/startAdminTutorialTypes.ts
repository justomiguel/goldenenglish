import type { AdminTutorialId } from "@/lib/admin-tutorials/catalog";
import type { Dictionary } from "@/types/i18n";

export type StartAdminTutorialInput = {
  id: AdminTutorialId;
  locale: string;
  pathname: string;
  toursDict: Dictionary["dashboard"]["adminHelpTours"];
  push: (href: string) => void;
};
