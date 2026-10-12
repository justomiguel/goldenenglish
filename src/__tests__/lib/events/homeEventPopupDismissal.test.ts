/** @vitest-environment node */
// REGRESSION CHECK: Closing the home popup hides that exact set for the session.
// A new or removed event must show the dialog again.
import { describe, expect, it } from "vitest";
import {
  homeEventPopupSetKey,
  shouldOpenHomeEventPopup,
} from "@/lib/events/homeEventPopupDismissal";

describe("shouldOpenHomeEventPopup", () => {
  it("stays closed when the stored set matches the current events", () => {
    const ids = ["b", "a"];
    expect(shouldOpenHomeEventPopup(homeEventPopupSetKey(ids), ["a", "b"])).toBe(false);
  });

  it("opens when the set changes or nothing was dismissed", () => {
    expect(shouldOpenHomeEventPopup(null, ["a"])).toBe(true);
    expect(shouldOpenHomeEventPopup(homeEventPopupSetKey(["a"]), ["a", "b"])).toBe(true);
    expect(shouldOpenHomeEventPopup(homeEventPopupSetKey(["a", "b"]), [])).toBe(false);
  });
});
