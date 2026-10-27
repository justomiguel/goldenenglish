export function canEditAcademicProfileValue(input: {
  isAdmin: boolean;
  isLeadOrListedAssistant: boolean;
  studentEnrolledInSection: boolean;
}): boolean {
  return input.isAdmin || (input.isLeadOrListedAssistant && input.studentEnrolledInSection);
}
