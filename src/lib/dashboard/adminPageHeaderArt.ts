import type { AdminSurfaceIconId } from "@/lib/dashboard/adminSurfaceIcon";

export const ADMIN_PAGE_HEADER_ART_FAMILIES = [
  "students",
  "teachers",
  "registrations",
  "academic",
  "finance",
  "messages",
  "institute",
  "parent",
  "student",
  "staff",
] as const;

export type AdminPageHeaderArtFamily = (typeof ADMIN_PAGE_HEADER_ART_FAMILIES)[number];

const FAMILY_BY_ICON: Record<AdminSurfaceIconId, AdminPageHeaderArtFamily> = {
  home: "institute",
  students: "students",
  parents: "parent",
  teachers: "teachers",
  registrations: "registrations",
  academic: "academic",
  finance: "finance",
  messages: "messages",
  institute: "institute",
  calendar: "academic",
  events: "academic",
  contents: "academic",
  badges: "academic",
  glossary: "academic",
  coupons: "finance",
  promotions: "finance",
  blog: "institute",
  cms: "institute",
  siteSetup: "institute",
  settings: "institute",
  questionnaires: "institute",
  analytics: "institute",
  audit: "institute",
  changelog: "institute",
  allAccounts: "students",
  emailTemplates: "messages",
};

export function adminPageHeaderArtFamily(
  iconId?: AdminSurfaceIconId,
): AdminPageHeaderArtFamily | null {
  if (!iconId) return null;
  return FAMILY_BY_ICON[iconId] ?? null;
}

export function adminPageHeaderArtSrc(
  iconId?: AdminSurfaceIconId,
  artFamily?: AdminPageHeaderArtFamily | null,
): string | null {
  const family = artFamily ?? adminPageHeaderArtFamily(iconId);
  if (!family) return null;
  return `/images/dashboard/admin-hero-${family}.webp`;
}
