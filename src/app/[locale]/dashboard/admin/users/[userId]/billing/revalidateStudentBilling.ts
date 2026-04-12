import { revalidatePath } from "next/cache";

export function revalidateStudentBillingPaths(locale: string, studentId: string) {
  revalidatePath(`/${locale}/dashboard/admin/users/${studentId}/billing`);
  revalidatePath(`/${locale}/dashboard/student/payments`);
}
