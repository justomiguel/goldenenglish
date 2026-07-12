const ADMINISTRATION_CHANNEL_SENDER_ROLES = new Set([
  "student",
  "parent",
  "site_contact",
]);

/**
 * True when an admin inbox/detail row should show Administration as To,
 * not the individual admin's profile name.
 */
export function isAdministrationBoundAdminInbound(params: {
  broadcastBatchId: string | null | undefined;
  senderRole: string;
}): boolean {
  if (params.broadcastBatchId != null && params.broadcastBatchId !== "") {
    return true;
  }
  return ADMINISTRATION_CHANNEL_SENDER_ROLES.has(params.senderRole);
}
