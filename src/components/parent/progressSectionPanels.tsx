import type { ReactNode } from "react";
import { ParentTasksListScreen } from "@/components/parent/ParentTasksListScreen";
import { ParentAssessmentsScreen } from "@/components/parent/ParentAssessmentsScreen";
import { ParentBadgesScreen } from "@/components/parent/ParentBadgesScreen";
import { ParentFeedbackSurface } from "@/components/parent/ParentFeedbackSurface";
import { StudentExamResultsSurface } from "@/components/parent/StudentExamResultsSurface";
import { StudentCourseList } from "@/components/student/StudentCourseList";
import type { ParentWardOption } from "@/components/parent/ParentWardPicker";
import type { StudentLearningTaskRow } from "@/types/learningTasks";
import type { StudentMiniTestAssessment } from "@/types/learningContent";
import type { ParentFeedbackTimeline } from "@/types/parentFeedback";
import type { StudentExamResult } from "@/types/studentExams";
import type { StudentBadgeRowModel } from "@/components/student/StudentBadgesScreen";
import type { StudentCourseCard } from "@/types/studentCourses";
import type { Dictionary } from "@/types/i18n";

export function progressSectionPanels(input: {
  locale: string;
  wardOptions: ParentWardOption[];
  selectedStudentId: string | null;
  exams: StudentExamResult[];
  tasks: StudentLearningTaskRow[];
  assessments: StudentMiniTestAssessment[];
  feedback: ParentFeedbackTimeline;
  badgeRows: StudentBadgeRowModel[];
  courses: StudentCourseCard[];
  parentLabels: Dictionary["dashboard"]["parent"];
  studentLabels: Dictionary["dashboard"]["student"];
  badgesDict: Dictionary["dashboard"]["student"]["badges"];
}): Record<string, ReactNode> {
  return {
    exams: <StudentExamResultsSurface locale={input.locale} exams={input.exams} copy={input.parentLabels.exams} />,
    tasks: (
      <ParentTasksListScreen
        locale={input.locale}
        tasks={input.tasks}
        wardOptions={input.wardOptions}
        selectedStudentId={input.selectedStudentId}
        parentLabels={input.parentLabels}
        studentLabels={input.studentLabels}
        embedded
      />
    ),
    courses: (
      <StudentCourseList
        locale={input.locale}
        courses={input.courses}
        labels={input.studentLabels.courses}
        canComplete
      />
    ),
    assessments: (
      <ParentAssessmentsScreen
        locale={input.locale}
        assessments={input.assessments}
        wardOptions={input.wardOptions}
        selectedStudentId={input.selectedStudentId}
        parentLabels={input.parentLabels}
        studentLabels={input.studentLabels}
        embedded
      />
    ),
    feedback: (
      <ParentFeedbackSurface locale={input.locale} timeline={input.feedback} copy={input.parentLabels.feedback} />
    ),
    badges: (
      <ParentBadgesScreen
        locale={input.locale}
        rows={input.badgeRows}
        wardOptions={input.wardOptions}
        selectedStudentId={input.selectedStudentId}
        parentLabels={input.parentLabels}
        badgesDict={input.badgesDict}
        embedded
      />
    ),
  };
}
