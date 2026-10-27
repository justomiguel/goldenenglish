// REGRESSION CHECK: page tabs must ignore unknown ids and keep other query keys.
import { beforeEach, describe, expect, it } from "vitest";
import {
  hrefWithPageTab,
  pageTabStorageKey,
  parsePersistentTab,
  readStoredPageTab,
  writeStoredPageTab,
} from "@/lib/navigation/persistentPageTab";

const ALLOWED = ["summary", "academic"] as const;

describe("parsePersistentTab", () => {
  it("returns a known id", () => {
    expect(parsePersistentTab("academic", ALLOWED)).toBe("academic");
  });

  it("returns null for an empty or unknown id", () => {
    expect(parsePersistentTab(null, ALLOWED)).toBeNull();
    expect(parsePersistentTab("", ALLOWED)).toBeNull();
    expect(parsePersistentTab("nope", ALLOWED)).toBeNull();
  });
});

describe("page tab storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("keys the path without the query", () => {
    expect(pageTabStorageKey("/es/dashboard/admin/users/1?tab=academic", "tab")).toBe(
      "ge:page-tab:tab:/es/dashboard/admin/users/1",
    );
  });

  it("round-trips a stored tab", () => {
    const key = pageTabStorageKey("/es/users/1", "tab");
    writeStoredPageTab(key, "academic");
    expect(readStoredPageTab(key)).toBe("academic");
  });
});

describe("hrefWithPageTab", () => {
  it("sets tab and keeps the other keys", () => {
    expect(hrefWithPageTab("/es/users/1", "page=2", "tab", "academic")).toBe(
      "/es/users/1?page=2&tab=academic",
    );
  });
});
