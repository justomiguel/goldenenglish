import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });
const createServerClient = vi.fn(() => ({
  auth: { getUser: mockGetUser },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...a: unknown[]) => createServerClient(...a),
}));

import { updateSession } from "@/lib/supabase/middleware";

describe("updateSession", () => {
  const prevEnv = { ...process.env };
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  let nextSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    createServerClient.mockImplementation(() => ({
      auth: { getUser: mockGetUser },
    }));
    nextSpy = vi
      .spyOn(NextResponse, "next")
      .mockImplementation(() => new NextResponse(null, { status: 200 }));
  });

  afterEach(() => {
    nextSpy.mockRestore();
    process.env = { ...prevEnv };
    warn.mockClear();
  });

  it("skips Supabase when public env incomplete", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const req = new NextRequest(new URL("http://localhost/es"), {
      headers: new Headers(),
    });
    const { response: res } = await updateSession(req);
    expect(res.status).toBe(200);
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("warns in development when env incomplete", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const req = new NextRequest(new URL("http://localhost/es"), {
      headers: new Headers(),
    });
    await updateSession(req);
    expect(warn).toHaveBeenCalled();
  });

  it("refreshes session when env configured", async () => {
    process.env.NODE_ENV = "test";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    const req = new NextRequest(new URL("http://localhost/es"), {
      headers: new Headers(),
    });
    await updateSession(req);
    expect(createServerClient).toHaveBeenCalled();
    expect(mockGetUser).toHaveBeenCalled();
  });

  it("exposes request cookies through getAll adapter", async () => {
    process.env.NODE_ENV = "test";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";

    let getAll: (() => { name: string; value: string }[]) | undefined;
    createServerClient.mockImplementation(
      (_u: string, _k: string, opts: { cookies: { getAll: typeof getAll } }) => {
        getAll = opts.cookies.getAll;
        return { auth: { getUser: mockGetUser } };
      },
    );

    const req = new NextRequest(new URL("http://localhost/es"), {
      headers: new Headers({ cookie: "a=b" }),
    });
    await updateSession(req);
    const all = getAll?.() ?? [];
    expect(all.some((c) => c.name === "a" && c.value === "b")).toBe(true);
  });

  it("cookie setAll mirrors cookies onto the response", async () => {
    process.env.NODE_ENV = "test";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";

    const resWithCookie = new NextResponse(null, { status: 200 });
    const cookieSet = vi.spyOn(resWithCookie.cookies, "set");

    let setAll:
      | ((
          cookies: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[],
        ) => void)
      | undefined;

    createServerClient.mockImplementation(
      (_url: string, _key: string, opts: { cookies: { setAll: typeof setAll } }) => {
        setAll = opts.cookies.setAll;
        return { auth: { getUser: mockGetUser } };
      },
    );

    nextSpy
      .mockImplementationOnce(() => new NextResponse(null, { status: 200 }))
      .mockImplementationOnce(() => resWithCookie);

    const req = new NextRequest(new URL("http://localhost/es"), {
      headers: new Headers(),
    });
    await updateSession(req);

    setAll?.([
      { name: "sb-access-token", value: "tok", options: { path: "/" } },
    ]);

    expect(cookieSet).toHaveBeenCalledWith(
      "sb-access-token",
      "tok",
      expect.objectContaining({ path: "/" }),
    );
  });
});
