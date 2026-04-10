import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const supabaseCreate = vi.fn(() => ({}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...a: unknown[]) => supabaseCreate(...a),
}));

import { createAdminClient } from "@/lib/supabase/admin";

describe("createAdminClient", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("throws when service role key is missing", () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => createAdminClient()).toThrow(/Missing SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("returns admin client when key is set", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-secret";
    const c = createAdminClient();
    expect(c).toBeDefined();
    expect(supabaseCreate).toHaveBeenCalled();
  });
});
