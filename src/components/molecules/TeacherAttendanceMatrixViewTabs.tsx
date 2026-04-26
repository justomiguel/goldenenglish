"use client";

import { Calendar, TableProperties } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";

export type TeacherAttendanceMatrixView = "sheet" | "calendar";

export interface TeacherAttendanceMatrixViewTabsProps {
  view: TeacherAttendanceMatrixView;
  onViewChange: (v: TeacherAttendanceMatrixView) => void;
  dict: Dictionary["dashboard"]["teacherSectionAttendance"]["matrix"];
}

export function TeacherAttendanceMatrixViewTabs({ view, onViewChange, dict }: TeacherAttendanceMatrixViewTabsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={dict.viewTabsAria}>
      <Button
        type="button"
        variant={view === "sheet" ? "primary" : "secondary"}
        size="sm"
        className="min-h-10"
        aria-selected={view === "sheet"}
        onClick={() => onViewChange("sheet")}
      >
        <TableProperties className="h-4 w-4 shrink-0" aria-hidden />
        {dict.viewSheet}
      </Button>
      <Button
        type="button"
        variant={view === "calendar" ? "primary" : "secondary"}
        size="sm"
        className="min-h-10"
        aria-selected={view === "calendar"}
        onClick={() => onViewChange("calendar")}
      >
        <Calendar className="h-4 w-4 shrink-0" aria-hidden />
        {dict.viewCalendar}
      </Button>
    </div>
  );
}
