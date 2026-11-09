import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";

/** Page render: missing session becomes a redirect. Actions keep `assertAdmin` throws. */
export async function requireAdminPage(locale: string) {
  try {
    return await assertAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === ADMIN_SESSION_UNAUTHORIZED) {
      redirect(`/${locale}/login?next=/${locale}/dashboard/admin`);
    }
    if (message === ADMIN_SESSION_FORBIDDEN) {
      redirect(`/${locale}`);
    }
    throw error;
  }
}
