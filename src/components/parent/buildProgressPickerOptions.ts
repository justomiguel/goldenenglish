import { Award, BookOpenCheck, ClipboardCheck, GraduationCap, ScrollText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProgressSection, ProgressSectionId } from "@/lib/parent/buildProgressSections";
import {
  formatProgressSectionCount,
  formatProgressUnread,
  formatProgressUnreadAria,
  progressSectionLabel,
  type ProgressPickerCopy,
} from "@/lib/parent/formatProgressSectionLabels";
import type { ProgressPickerOption } from "@/components/parent/progressPickerOption";

const SECTION_ICONS: Record<ProgressSectionId, LucideIcon> = {
  exams: GraduationCap,
  tasks: BookOpenCheck,
  assessments: ClipboardCheck,
  feedback: ScrollText,
  badges: Award,
};

/** Turns available sections plus unread counters into ready-to-render picker entries. */
export function buildProgressPickerOptions(params: {
  sections: ProgressSection[];
  unreadBySection: Record<string, number>;
  copy: ProgressPickerCopy;
}): ProgressPickerOption[] {
  const { sections, unreadBySection, copy } = params;

  return sections.map((section) => {
    const label = progressSectionLabel(section.id, copy);
    const unreadCount = unreadBySection[section.id] ?? 0;
    return {
      id: section.id,
      label,
      Icon: SECTION_ICONS[section.id],
      countLabel: formatProgressSectionCount(section.id, section.count, copy),
      unreadCount,
      unreadLabel: formatProgressUnread(unreadCount, copy),
      unreadAria: formatProgressUnreadAria(unreadCount, label, copy),
    };
  });
}
