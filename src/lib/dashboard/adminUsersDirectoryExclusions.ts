import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";

/** Synthetic portal sender for public contact form — not a staff directory user. */
export const ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE = "site_contact";

export const ADMIN_USERS_DIRECTORY_EXCLUDED_PROFILE_IDS = [
  PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID,
] as const;

type ProfileQueryWithNeq = {
  neq: (column: string, value: string) => unknown;
};

/** PostgREST filters shared by paginated list + count queries on `profiles`. */
export function applyAdminUsersDirectoryProfileFilters(query: ProfileQueryWithNeq): unknown {
  let next = query.neq("role", ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE) as ProfileQueryWithNeq;
  for (const id of ADMIN_USERS_DIRECTORY_EXCLUDED_PROFILE_IDS) {
    next = next.neq("id", id) as ProfileQueryWithNeq;
  }
  return next;
}
