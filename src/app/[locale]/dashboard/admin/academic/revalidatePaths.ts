import { revalidatePath } from "next/cache";

/** Call from server actions after academic mutations. */
export function revalidateAcademicSurfaces(locale: string) {
  revalidatePath(`/${locale}/dashboard/admin/academic`, "layout");
  revalidatePath(`/${locale}/dashboard/admin/requests`);
  revalidatePath(`/${locale}/dashboard/admin/retention`);
  revalidatePath(`/${locale}/dashboard/teacher/sections`);
  revalidatePath(`/${locale}/dashboard/teacher/academics`);
}
