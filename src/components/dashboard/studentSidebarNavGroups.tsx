import type { ReactNode } from "react";
import { Award, BookOpenCheck, Calendar, ClipboardCheck, Home, MessageCircle, User, Wallet } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export type StudentSidebarNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  tip?: string;
};

export type StudentSidebarNavGroup = {
  label: string | null;
  items: StudentSidebarNavItem[];
};

const ic = "h-4 w-4 shrink-0 opacity-80";

export function buildStudentSidebarNavGroups(
  base: string,
  profileHref: string,
  dict: Dictionary["dashboard"]["studentNav"],
): StudentSidebarNavGroup[] {
  const learningItems: StudentSidebarNavItem[] = [
    {
      href: `${base}/calendar`,
      label: dict.calendar,
      icon: <Calendar className={ic} />,
      tip: dict.tipCalendar,
    },
    {
      href: `${base}/tasks`,
      label: dict.tasks,
      icon: <BookOpenCheck className={ic} />,
      tip: dict.tipTasks,
    },
  ];
  if (base.includes("/dashboard/student")) {
    learningItems.push({
      href: `${base}/badges`,
      label: dict.badges,
      icon: <Award className={ic} />,
      tip: dict.tipBadges,
    });
    learningItems.push({
      href: `${base}/assessments`,
      label: dict.assessments,
      icon: <ClipboardCheck className={ic} />,
      tip: dict.tipAssessments,
    });
  }

  return [
    {
      label: dict.navScopeStudent,
      items: [
        {
          href: base,
          label: dict.home,
          icon: <Home className={ic} />,
          tip: dict.tipHome,
        },
      ],
    },
    {
      label: dict.groupLearning,
      items: learningItems,
    },
    {
      label: dict.groupFinance,
      items: [
        {
          href: `${base}/payments`,
          label: dict.payments,
          icon: <Wallet className={ic} />,
          tip: dict.tipPayments,
        },
      ],
    },
    {
      label: dict.groupComms,
      items: [
        {
          href: `${base}/messages`,
          label: dict.messages,
          icon: <MessageCircle className={ic} />,
          tip: dict.tipMessages,
        },
      ],
    },
    {
      label: dict.groupYou,
      items: [
        {
          href: profileHref,
          label: dict.myProfile,
          icon: <User className={ic} />,
          tip: dict.tipMyProfile,
        },
      ],
    },
  ];
}
