import { describe, it, expect } from "vitest";
import {
  buildFlowStoredResumeLine,
  type FlowStoredResumeDict,
} from "@/lib/payment-gateways/flowAdminStoredResume";

// REGRESSION CHECK: resume copy only composes translated fragments; separators stay neutral.

const d: FlowStoredResumeDict = {
  flowStoredResumeMissing: "NONE",
  flowSnippetKeysPresent: "KEYS",
  flowEnvSandbox: "SB",
  flowEnvProduction: "PROD",
  flowSnippetCheckoutOn: "ON",
  flowSnippetCheckoutOff: "OFF",
};

describe("buildFlowStoredResumeLine", () => {
  it("returns missing phrase when credentials absent", () => {
    expect(
      buildFlowStoredResumeLine({ hasCredentials: false, environment: "sandbox", enabled: false }, d),
    ).toBe("NONE");
  });

  it("orders keys present, environment, checkout", () => {
    expect(
      buildFlowStoredResumeLine({ hasCredentials: true, environment: "production", enabled: false }, d),
    ).toBe(`KEYS\u00a0·\u00a0PROD\u00a0·\u00a0OFF`);
  });
});
