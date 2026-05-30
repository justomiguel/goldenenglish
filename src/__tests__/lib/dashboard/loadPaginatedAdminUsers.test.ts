import { describe, expect, it, vi } from "vitest";
import { loadPaginatedAdminUsers } from "@/lib/dashboard/loadPaginatedAdminUsers";
import {
  ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE,
} from "@/lib/dashboard/adminUsersDirectoryExclusions";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";

function queryResult(result: unknown) {
  return {
    neq: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => resolve(result),
  };
}

describe("loadPaginatedAdminUsers", () => {
  it("excludes site_contact from data and count queries", async () => {
    // REGRESSION CHECK: synthetic contact-form sender must not appear in admin users directory.
    const dataQuery = queryResult({ data: [], error: null });
    const countQuery = queryResult({ count: 0, error: null });
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: vi.fn(() => dataQuery) })
      .mockReturnValueOnce({ select: vi.fn(() => countQuery) });

    const adminClient = {
      from,
      auth: { admin: { getUserById: vi.fn().mockResolvedValue({ data: { user: null } }) } },
    };

    await loadPaginatedAdminUsers(adminClient as never, "—", { page: 1 });

    expect(dataQuery.neq).toHaveBeenCalledWith("role", ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE);
    expect(dataQuery.neq).toHaveBeenCalledWith("id", PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID);
    expect(countQuery.neq).toHaveBeenCalledWith("role", ADMIN_USERS_DIRECTORY_EXCLUDED_ROLE);
    expect(countQuery.neq).toHaveBeenCalledWith("id", PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID);
  });
});
