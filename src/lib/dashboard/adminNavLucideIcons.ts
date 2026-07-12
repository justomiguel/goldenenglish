import {
  Banknote,
  BookOpen,
  BookOpenCheck,
  Calendar,
  CalendarDays,
  ClipboardList,
  Gift,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Stable Lucide ids for admin sidebar nav and glossary rows.
 * Keep glossary term icons aligned with these menu icons.
 */
export type AdminNavIconId =
  | "calendar-days"
  | "calendar"
  | "book-open-check"
  | "book-open"
  | "users"
  | "banknote"
  | "clipboard-list"
  | "gift"
  | "ticket";

export const ADMIN_NAV_LUCIDE_ICONS: Record<AdminNavIconId, LucideIcon> = {
  "calendar-days": CalendarDays,
  calendar: Calendar,
  "book-open-check": BookOpenCheck,
  "book-open": BookOpen,
  users: Users,
  banknote: Banknote,
  "clipboard-list": ClipboardList,
  gift: Gift,
  ticket: Ticket,
};
