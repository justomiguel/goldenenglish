import type { LucideIcon } from "lucide-react";
import type { ProgressSectionId } from "@/lib/parent/buildProgressSections";

/** One entry of the Progress picker, already translated by the caller. */
export type ProgressPickerOption = {
  id: ProgressSectionId;
  label: string;
  Icon: LucideIcon;
  /** e.g. "3 comments", or the load-failure notice when the section could not be read. */
  countLabel: string;
  /** The section is offered so the family can retry it, not because it has content. */
  failed?: boolean;
  unreadCount: number;
  /** e.g. "3 unread"; `null` when everything has been seen. */
  unreadLabel: string | null;
  unreadAria: string;
};

export function totalUnread(options: ProgressPickerOption[]): number {
  return options.reduce((sum, option) => sum + option.unreadCount, 0);
}
