import { canCreateFreeSite } from "@/lib/pulsar/freeSitePlan";

/** Signed-out visitors register. A session opens the free page form. */
export function pulsarStartFreePath(locale: string, signedIn: boolean): string {
  return signedIn ? `/${locale}/cuenta/nuevo` : `/${locale}/cuenta/registro`;
}

/** Pending and approved logins can open a free page. Rejected cannot. */
export function ownerMayCreateFreeSite(status: string | null | undefined): boolean {
  return status === "approved" || status === "pending";
}

export function signedInCanOpenCreateForm(input: {
  status: "missing" | "pending" | "approved" | "rejected";
  ownedCount: number;
}): boolean {
  if (input.status === "rejected") return false;
  if (input.status === "missing") return true;
  return canCreateFreeSite(input.ownedCount);
}
