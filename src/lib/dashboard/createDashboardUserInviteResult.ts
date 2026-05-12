/** Return shape for admin dashboard user invite (`createDashboardUser`). */
export type CreateDashboardUserResult =
  | { ok: true; userId: string }
  | { ok: false; message?: string }
  | {
      ok: false;
      needsGuardianReuseConfirm: true;
      userId: string;
      reuseKind: "reused_parent" | "reused_admin";
      existingProfileId: string;
    };
