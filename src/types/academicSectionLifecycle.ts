export type AcademicSectionLifecycleDict = {
  archivedBanner: string;
  cohortArchivedHint: string;
  archiveButton: string;
  unarchiveButton: string;
  deleteButton: string;
  modalArchiveTitle: string;
  modalArchiveBody: string;
  modalUnarchiveTitle: string;
  modalUnarchiveBody: string;
  modalDeleteTitle: string;
  modalDeleteBody: string;
  modalDeleteBodyWithEnrollments: string;
  enrollmentsListHeading: string;
  loadingEnrollments: string;
  deleteConfirmCheckbox: string;
  deleteConfirmCheckboxWithEnrollments: string;
  deleteButtonAria: string;
  confirm: string;
  cancel: string;
  enrollmentStatus: {
    active: string;
    dropped: string;
    transferred: string;
    completed: string;
  };
  errors: {
    active_enrollments: string;
    cohort_archived: string;
    enrollments_exist: string;
    save: string;
    parse: string;
  };
};
