import { ADMIN_NAV_LUCIDE_ICONS } from "@/lib/dashboard/adminNavLucideIcons";
import type { AdminGlossaryIconId } from "@/lib/admin-tutorials/glossary";

/** Glossary row icons — same Lucide map as admin sidebar nav. */
export const ADMIN_GLOSSARY_ICONS: Record<AdminGlossaryIconId, (typeof ADMIN_NAV_LUCIDE_ICONS)[AdminGlossaryIconId]> =
  ADMIN_NAV_LUCIDE_ICONS;
