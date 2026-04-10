import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as cookie from "cookie";

const createBrowserClient = vi.fn(() => ({
  auth: { signInWithPassword: vi.fn() },
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (...a: unknown[]) => createBrowserClient(...a),
}));

import {
  createClient,
  getRememberMePreference,
  setRememberMePreference,
} from "@/lib/supabase/client";

function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  const ls = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: ls,
    writable: true,
  });
}

describe("Supabase browser helpers", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    installMemoryLocalStorage();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test";
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("createClient wires browser client + cookies", () => {
    const c = createClient();
    expect(c).toBeDefined();
    expect(createBrowserClient).toHaveBeenCalled();
    const opts = createBrowserClient.mock.calls[0]?.[2] as {
      cookies: {
        getAll: () => { name: string; value: string }[];
        setAll: (
          v: { name: string; value: string; options?: { maxAge?: number } }[],
        ) => void;
      };
    };
    document.cookie = "sb-access-token=abc";
    expect(opts.cookies.getAll().length).toBeGreaterThan(0);
    opts.cookies.setAll([{ name: "x", value: "y", options: { path: "/" } }]);
    expect(document.cookie).toContain("x=");
  });

  it("cookie setAll uses brief maxAge when remember is off", () => {
    window.localStorage.setItem("ge_auth_remember", "0");
    createClient();
    const opts = createBrowserClient.mock.calls[0]?.[2] as {
      cookies: { setAll: (v: { name: string; value: string }[]) => void };
    };
    opts.cookies.setAll([{ name: "s", value: "v" }]);
    expect(document.cookie).toContain("s=");
  });

  it("cookie setAll treats empty value as delete (maxAge 0)", () => {
    createClient();
    const opts = createBrowserClient.mock.calls[0]?.[2] as {
      cookies: { setAll: (v: { name: string; value: string }[]) => void };
    };
    opts.cookies.setAll([{ name: "z", value: "" }]);
    expect(document.cookie).toContain("Max-Age=0");
  });

  it("cookie setAll treats explicit maxAge 0 in options as delete", () => {
    createClient();
    const opts = createBrowserClient.mock.calls[0]?.[2] as {
      cookies: {
        setAll: (
          v: { name: string; value: string; options?: { maxAge?: number } }[],
        ) => void;
      };
    };
    opts.cookies.setAll([
      {
        name: "m",
        value: "keep-value",
        options: { path: "/", maxAge: 0 },
      },
    ]);
    expect(document.cookie).toContain("Max-Age=0");
  });

  it("cookie setAll treats null options like empty merge base", () => {
    createClient();
    const opts = createBrowserClient.mock.calls[0]?.[2] as {
      cookies: {
        setAll: (
          v: {
            name: string;
            value: string;
            options?: object | null;
          }[],
        ) => void;
      };
    };
    expect(() =>
      opts.cookies.setAll([
        { name: "nullopt", value: "v", options: null },
      ]),
    ).not.toThrow();
  });

  it("getRememberMePreference reads localStorage on client", () => {
    window.localStorage.setItem("ge_auth_remember", "0");
    expect(getRememberMePreference()).toBe(false);
  });

  it("getRememberMePreference treats empty stored value as off", () => {
    window.localStorage.setItem("ge_auth_remember", "");
    expect(getRememberMePreference()).toBe(false);
  });

  it("getRememberMePreference returns true when stored as 1", () => {
    window.localStorage.setItem("ge_auth_remember", "1");
    expect(getRememberMePreference()).toBe(true);
  });

  it("setRememberMePreference writes localStorage", () => {
    setRememberMePreference(true);
    expect(window.localStorage.getItem("ge_auth_remember")).toBe("1");
    setRememberMePreference(false);
    expect(window.localStorage.getItem("ge_auth_remember")).toBe("0");
  });

  it("setRememberMePreference no-ops when window is stubbed away", () => {
    vi.stubGlobal("window", undefined);
    expect(() => setRememberMePreference(true)).not.toThrow();
    vi.unstubAllGlobals();
  });

  it("getAll maps undefined cookie values to empty string", () => {
    const spy = vi.spyOn(cookie, "parse").mockReturnValue({
      n: undefined as unknown as string,
    });
    const c = createClient();
    const opts = createBrowserClient.mock.calls[0]?.[2] as {
      cookies: { getAll: () => { name: string; value: string }[] };
    };
    expect(opts.cookies.getAll()).toEqual([{ name: "n", value: "" }]);
    spy.mockRestore();
    void c;
  });
});
