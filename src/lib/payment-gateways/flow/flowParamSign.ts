import { createHmac } from "crypto";

/**
 * Flow.cl API: sign parameters with secret key (HMAC-SHA256 hex).
 * Exclude `s` from the map before calling; append `s` after.
 * @see https://developers.flow.cl/docs/intro
 */
export function signFlowParams(params: Record<string, string>, secretKey: string): string {
  const keys = Object.keys(params).filter((k) => k !== "s");
  keys.sort((a, b) => a.localeCompare(b, "en"));
  let toSign = "";
  for (const key of keys) {
    toSign += key + params[key];
  }
  return createHmac("sha256", secretKey).update(toSign).digest("hex");
}
