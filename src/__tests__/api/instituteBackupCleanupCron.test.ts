/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyCronRequest } = vi.hoisted(() => ({
  verifyCronRequest: vi.fn(() => false),
}));

vi.mock("@/lib/auth/verifyCronRequest", () => ({
  verifyCronRequest: () => verifyCronRequest(),
}));
vi.mock("@/lib/supabase/pulsar", () => ({
  createPulsarAdminClient: () => {
    throw new Error("should not run");
  },
  isPulsarSupabaseConfigured: () => true,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
  logSupabaseError: vi.fn(),
}));

import { GET } from "@/app/api/cron/institute-backups-cleanup/route";

describe("institute backup cleanup cron", () => {
  beforeEach(() => {
    verifyCronRequest.mockReturnValue(false);
  });

  it("rejects a secret in the query string", async () => {
    const response = await GET(new Request("http://localhost/api/cron/institute-backups-cleanup?secret=leak"));
    expect(response.status).toBe(401);
  });
});
