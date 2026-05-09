import { revalidatePath } from "next/cache";

export function revalidateStudentBillingPaths(locale: string, studentId: string) {
  revalidatePath(`/${locale}/dashboard/admin/users/${studentId}/billing`);
  revalidatePath(`/${locale}/dashboard/admin/users/${studentId}`);
  revalidatePath(`/${locale}/dashboard/admin/finance`);
  // Section matrix and `/collections/[sectionId]` read shared billing/enrollment state.
  revalidatePath(`/${locale}/dashboard/admin/finance/collections`, "layout");
  revalidatePath(`/${locale}/dashboard/student/payments`);
  revalidatePath(`/${locale}/dashboard/parent/payments`);
}
