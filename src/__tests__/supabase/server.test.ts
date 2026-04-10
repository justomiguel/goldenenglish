import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const createServerClient = vi.fn(() => ({
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...a: unknown[]) => createServerClient(...a),
}));

const mockCookieSet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: mockCookieSet,
  })),
}));

import { createClient } from "@/lib/supabase/server";

describe("createClient (server)", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieSet.mockImplementation(() => {});
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test";
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("creates server client with cookie adapters", async () => {
    const c = await createClient();
    expect(c).toBeDefined();
    expect(createServerClient).toHaveBeenCalled();
    const opts = createServerClient.mock.calls[0]?.[2] as {
      cookies: { getAll: () => unknown[]; setAll: (v: unknown) => void };
    };
    expect(opts.cookies.getAll()).toEqual([]);
    opts.cookies.setAll([]);
  });

  it("ignores cookie set errors from Server Component context", async () => {
    mockCookieSet.mockImplementation(() => {
      throw new Error("Cookies are not available");
    });
    const c = await createClient();
    const opts = createServerClient.mock.calls[0]?.[2] as {
      cookies: {
        setAll: (
          v: { name: string; value: string; options?: object }[],
        ) => void;
      };
    };
    expect(() =>
      opts.cookies.setAll([{ name: "a", value: "b" }]),
    ).not.toThrow();
    expect(c).toBeDefined();
  });
});
