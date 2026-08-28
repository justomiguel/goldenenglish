import type { ReactNode } from "react";
import {
  Activity,
  Award,
  Banknote,
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  Home,
  LayoutTemplate,
  Mails,
  MessageCircle,
  Newspaper,
  Percent,
  Presentation,
  Rocket,
  ScrollText,
  Settings,
  Ticket,
  Users,
} from "lucide-react";

export const ADMIN_SURFACE_ICON_IDS = [
  "home",
  "students",
  "teachers",
  "registrations",
  "academic",
  "finance",
  "messages",
  "institute",
  "calendar",
  "events",
  "contents",
  "badges",
  "coupons",
  "promotions",
  "blog",
  "cms",
  "siteSetup",
  "settings",
  "allAccounts",
  "analytics",
  "audit",
  "glossary",
  "emailTemplates",
] as const;

export type AdminSurfaceIconId = (typeof ADMIN_SURFACE_ICON_IDS)[number];

const ICONS: Record<AdminSurfaceIconId, typeof Home> = {
  home: Home,
  students: GraduationCap,
  teachers: Presentation,
  registrations: ClipboardList,
  academic: CalendarDays,
  finance: Banknote,
  messages: MessageCircle,
  institute: Building2,
  calendar: Calendar,
  events: CalendarRange,
  contents: BookOpen,
  badges: Award,
  coupons: Ticket,
  promotions: Percent,
  blog: Newspaper,
  cms: LayoutTemplate,
  siteSetup: Rocket,
  settings: Settings,
  allAccounts: Users,
  analytics: Activity,
  audit: ScrollText,
  glossary: BookMarked,
  emailTemplates: Mails,
};

export function adminSurfaceIcon(
  id: AdminSurfaceIconId,
  className = "h-7 w-7",
): ReactNode {
  const Icon = ICONS[id];
  if (!Icon) return null;
  return <Icon className={className} strokeWidth={1.25} aria-hidden />;
}
