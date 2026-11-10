"use server";

import { revalidatePath } from "next/cache";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { savePlatformOperatorAdminPassword } from "@/lib/pulsar/platformOperatorPassword";

export async function savePlatformOperatorPasswordAction(raw: {
  locale: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  const session = await getPulsarStaffSession();
  if (!session || session.mustChangePassword) return { ok: false, errorCode: "unauthorized" };
  const saved = await savePlatformOperatorAdminPassword({
    password: raw.password,
    actorUserId: session.userId,
    actorEmail: session.email,
  });
  if (!saved.ok) return saved;
  revalidatePath(`/${raw.locale}/admin`);
  return { ok: true };
}
