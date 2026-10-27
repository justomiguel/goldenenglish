import type { AcademicProfileFieldType } from "@/lib/academic-profile/academicProfileFieldRules";

export const ACADEMIC_PROFILE_FILES_BUCKET = "academic-profile-files";

export type AcademicProfileCardField = {
  id: string;
  label: string;
  fieldType: AcademicProfileFieldType;
  selectOptions: string[];
  required: boolean;
  showInDirectory: boolean;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
  storagePath: string | null;
  fileUrl: string | null;
};
