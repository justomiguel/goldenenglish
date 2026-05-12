export type EnsureParentReuseKind =
  | "created"
  /** Auth user existed with this login but lacked a portal profile; profile was provisioned via admin/import. */
  | "provisioned_prior_auth"
  | "reused_parent"
  | "reused_admin";

export type EnsureParentProfileResult =
  | { ok: true; parentId: string; reuseKind: EnsureParentReuseKind }
  | { ok: false; message: string; incidentRef?: string };
