// REGRESSION CHECK: isolated e2e navigations must retry webpack cold-compile aborts.
import { describe, expect, it } from "vitest";
import { isRetryableGotoError } from "../../../e2e/helpers/gotoIsolated";

describe("isRetryableGotoError", () => {
  it("retries aborted / suspended navigations", () => {
    expect(isRetryableGotoError("page.goto: net::ERR_ABORTED; maybe frame was detached?")).toBe(
      true,
    );
    expect(
      isRetryableGotoError("page.goto: net::ERR_NETWORK_IO_SUSPENDED at http://127.0.0.1:3100"),
    ).toBe(true);
    expect(isRetryableGotoError("page.goto: Test timeout of 90000ms exceeded.")).toBe(true);
  });

  it("does not retry assertion / contract failures", () => {
    expect(isRetryableGotoError("expect(locator).toBeVisible() failed")).toBe(false);
    expect(isRetryableGotoError("strict mode violation")).toBe(false);
  });
});
