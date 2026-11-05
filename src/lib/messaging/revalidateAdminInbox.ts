import { revalidatePath } from "next/cache";

/** Refresh the messages list and the admin shell badge. */
export function revalidateAdminInbox(locale: string): void {
  revalidatePath(`/${locale}/dashboard/admin/messages`);
  revalidatePath(`/${locale}/dashboard/admin`, "layout");
}
