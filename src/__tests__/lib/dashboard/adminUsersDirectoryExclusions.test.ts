import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE,
  applyAdminUsersDirectoryProfileFilters,
} from "@/lib/dashboard/adminUsersDirectoryExclusions";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";

describe("applyAdminUsersDirectoryProfileFilters", () => {
  it("excludes site_contact role and the fixed sender profile id", () => {
    const neq = vi.fn().mockReturnThis();
    const query = { neq } as { neq: typeof neq };

    applyAdminUsersDirectoryProfileFilters(query);

    expect(neq).toHaveBeenCalledWith("role", ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE);
    expect(neq).toHaveBeenCalledWith("id", PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID);
    expect(neq).toHaveBeenCalledTimes(2);
  });
});
