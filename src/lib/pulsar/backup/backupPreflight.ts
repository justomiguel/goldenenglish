export type RestoreFacts = {
  lastMigration: string | null;
  deployedMigrations: readonly string[];
  slugTaken: boolean;
  schemaExists: boolean;
  hosts: readonly string[];
  occupiedHosts: readonly string[];
  authIds: readonly string[];
  existingAuthIds: readonly string[];
  authEmails: readonly string[];
  existingAuthEmails: readonly string[];
};

export type RestoreRefusal =
  | "backup_newer_than_app"
  | "slug_taken"
  | "schema_exists"
  | "host_taken"
  | "auth_user_exists";

/** Returns the first reason to refuse a restore before any write. */
export function restoreRefusal(facts: RestoreFacts): RestoreRefusal | null {
  if (facts.slugTaken) return "slug_taken";
  if (facts.schemaExists) return "schema_exists";
  if (
    facts.lastMigration &&
    !facts.deployedMigrations.includes(facts.lastMigration)
  ) {
    return "backup_newer_than_app";
  }
  const occupied = new Set(facts.occupiedHosts.map((host) => host.trim().toLowerCase()));
  if (facts.hosts.some((host) => occupied.has(host.trim().toLowerCase()))) return "host_taken";
  const ids = new Set(facts.existingAuthIds);
  if (facts.authIds.some((id) => ids.has(id))) return "auth_user_exists";
  const emails = new Set(facts.existingAuthEmails.map((email) => email.trim().toLowerCase()));
  if (facts.authEmails.some((email) => emails.has(email.trim().toLowerCase()))) {
    return "auth_user_exists";
  }
  return null;
}
