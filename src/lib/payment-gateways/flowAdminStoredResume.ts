/**
 * Visible summary of persisted Flow Chile gateway snapshot (finance admin).
 * Tokens joined with middle dots — factual labels live in dictionaries.
 */

export type FlowAdminGateResumeSnapshot = {
  hasCredentials: boolean;
  environment: "sandbox" | "production";
  enabled: boolean;
};

export type FlowStoredResumeDict = {
  flowStoredResumeMissing: string;
  flowSnippetKeysPresent: string;
  flowEnvSandbox: string;
  flowEnvProduction: string;
  flowSnippetCheckoutOn: string;
  flowSnippetCheckoutOff: string;
};

export function buildFlowStoredResumeLine(
  snap: FlowAdminGateResumeSnapshot,
  d: FlowStoredResumeDict,
): string {
  if (!snap.hasCredentials) return d.flowStoredResumeMissing;
  const env = snap.environment === "production" ? d.flowEnvProduction : d.flowEnvSandbox;
  const chk = snap.enabled ? d.flowSnippetCheckoutOn : d.flowSnippetCheckoutOff;
  return [d.flowSnippetKeysPresent, env, chk].join("\u00a0·\u00a0");
}
