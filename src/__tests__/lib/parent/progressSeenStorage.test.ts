// REGRESSION CHECK: this is the only place that decides what "already read" means on Progress. It
// must never throw on foreign or corrupted localStorage payloads (a throw here would blank the whole
// screen), and it must keep the stored key list bounded so the entry cannot grow forever.

import { describe, expect, it } from "vitest";
import {
  PROGRESS_SEEN_MAX_KEYS_PER_SECTION,
  countUnreadKeys,
  mergeSeenKeys,
  parseSeenMap,
  progressSeenStorageKey,
  serializeSeenMap,
} from "@/lib/parent/progressSeenStorage";

describe("progressSeenStorageKey", () => {
  it("namespaces by version and student", () => {
    expect(progressSeenStorageKey("stu-1")).toBe("ge:progress-seen:v1:stu-1");
  });

  it("falls back to a shared bucket when there is no student", () => {
    expect(progressSeenStorageKey(null)).toBe("ge:progress-seen:v1:none");
  });
});

describe("parseSeenMap", () => {
  it("reads a well-formed payload", () => {
    expect(parseSeenMap('{"tasks":["a","b"]}')).toEqual({ tasks: ["a", "b"] });
  });

  it("returns an empty map for null, empty, or malformed input", () => {
    expect(parseSeenMap(null)).toEqual({});
    expect(parseSeenMap("")).toEqual({});
    expect(parseSeenMap("{not json")).toEqual({});
  });

  it("rejects payloads that are not an object of string arrays", () => {
    expect(parseSeenMap('["tasks"]')).toEqual({});
    expect(parseSeenMap('{"tasks":"a"}')).toEqual({});
    expect(parseSeenMap('{"tasks":[1,2]}')).toEqual({});
    expect(parseSeenMap("null")).toEqual({});
  });

  it("keeps only the well-formed entries of a partially broken payload", () => {
    expect(parseSeenMap('{"tasks":["a"],"badges":3}')).toEqual({ tasks: ["a"] });
  });
});

describe("countUnreadKeys", () => {
  it("counts every key as unread when the section was never opened", () => {
    expect(countUnreadKeys(["a", "b", "c"], undefined)).toBe(3);
  });

  it("counts only the keys missing from the seen list", () => {
    expect(countUnreadKeys(["a", "b", "c"], ["a", "c"])).toBe(1);
  });

  it("returns zero once everything has been seen", () => {
    expect(countUnreadKeys(["a", "b"], ["b", "a", "stale"])).toBe(0);
  });

  it("returns zero for an empty section", () => {
    expect(countUnreadKeys([], undefined)).toBe(0);
  });
});

describe("mergeSeenKeys", () => {
  it("adds the current keys to what was already seen without duplicates", () => {
    expect(mergeSeenKeys(["b", "c"], ["a", "b"])).toEqual(["a", "b", "c"]);
  });

  it("keeps the newest keys when the list exceeds the cap", () => {
    const previous = Array.from({ length: PROGRESS_SEEN_MAX_KEYS_PER_SECTION }, (_, i) => `old-${i}`);
    const merged = mergeSeenKeys(["fresh"], previous);

    expect(merged).toHaveLength(PROGRESS_SEEN_MAX_KEYS_PER_SECTION);
    expect(merged.at(-1)).toBe("fresh");
    expect(merged).not.toContain("old-0");
  });
});

describe("serializeSeenMap", () => {
  it("round-trips through parseSeenMap", () => {
    const map = { tasks: ["a"], feedback: ["f1", "f2"] };
    expect(parseSeenMap(serializeSeenMap(map))).toEqual(map);
  });
});
