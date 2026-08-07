export interface ParentFocusStudentOption {
  studentId: string;
  displayName: string;
}

export interface ParentFocusSectionOption {
  sectionId: string;
  /** e.g. "Teens — A1" (cohort — section name) */
  classLabel: string;
}

export interface ParentFocusCatalog {
  students: ParentFocusStudentOption[];
  /** Active sections keyed by studentId; missing key ⇒ no active sections */
  sectionsByStudentId: Record<string, ParentFocusSectionOption[]>;
}

export interface ParentFocusSearchParams {
  studentId?: string | null;
  sectionId?: string | null;
}

export interface ResolvedParentFocus {
  studentId: string | null;
  sectionId: string | null;
  student: ParentFocusStudentOption | null;
  sectionsForStudent: ParentFocusSectionOption[];
  section: ParentFocusSectionOption | null;
}
