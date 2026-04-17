export interface AcademicNewSectionModalDict {
  title: string;
  nameLabel: string;
  teacherLabel: string;
  teacherPlaceholder: string;
  maxStudentsLabel: string;
  maxStudentsDefaultHint: string;
  maxStudentsCustomize: string;
  maxStudentsCustomLabel: string;
  maxStudentsCustomHint: string;
  maxStudentsInvalid: string;
  submit: string;
  cancel: string;
  error: string;
  noTeachers: string;
  scheduleTitle: string;
  scheduleHint: string;
  scheduleAddSlot: string;
  scheduleRemoveSlot: string;
  scheduleDayLabel: string;
  scheduleStartLabel: string;
  scheduleEndLabel: string;
  scheduleInvalid: string;
  weekdays: {
    sun: string;
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
  };
  sectionPeriodStartsLabel: string;
  sectionPeriodEndsLabel: string;
}

export interface AcademicNewSectionModalProps {
  locale: string;
  cohortId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: { id: string; label: string }[];
  defaultMaxStudents: number;
  dict: AcademicNewSectionModalDict;
}
