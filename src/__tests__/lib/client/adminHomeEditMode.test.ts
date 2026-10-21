import { afterEach, describe, expect, it } from "vitest";
import {
  getAdminHomeEditMode,
  setAdminHomeEditMode,
} from "@/lib/client/adminHomeEditMode";

describe("adminHomeEditMode", () => {
  afterEach(() => {
    setAdminHomeEditMode(false);
  });

  it("turns the flag on and off", () => {
    expect(getAdminHomeEditMode()).toBe(false);
    setAdminHomeEditMode(true);
    expect(getAdminHomeEditMode()).toBe(true);
    setAdminHomeEditMode(false);
    expect(getAdminHomeEditMode()).toBe(false);
  });
});
