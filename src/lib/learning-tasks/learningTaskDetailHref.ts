/** Parent list links stay on the tutor route. A student list links to the student task. */
export function learningTaskDetailHref(input: {
  locale: string;
  taskInstanceId: string;
  studentId: string | null;
  taskDetailBase?: string;
}): string {
  if (input.taskDetailBase) {
    return `${input.taskDetailBase}/${input.taskInstanceId}`;
  }
  const studentId = input.studentId ?? "";
  return `/${input.locale}/dashboard/parent/tasks/${input.taskInstanceId}?studentId=${studentId}`;
}
