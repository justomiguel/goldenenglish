import type { LucideIcon } from "lucide-react";
import type { ProgressSectionId } from "@/lib/parent/buildProgressSections";

/** One entry of the Progress picker, already translated by the caller. */
export type ProgressPickerOption = {
  id: ProgressSectionId;
  label: string;
  Icon: LucideIcon;
  /** e.g. "3 comments". */
  countLabel: string;
  unreadCount: number;
  /** e.g. "3 unread"; `null` when everything has been seen. */
  unreadLabel: string | null;
  unreadAria: string;
};

export function totalUnread(options: ProgressPickerOption[]): number {
  return options.reduce((sum, option) => sum + option.unreadCount, 0);
}
