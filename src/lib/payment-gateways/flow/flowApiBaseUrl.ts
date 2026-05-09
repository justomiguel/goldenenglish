export type FlowEnvironment = "sandbox" | "production";

export function flowApiBaseUrl(env: FlowEnvironment): string {
  return env === "sandbox" ? "https://sandbox.flow.cl/api" : "https://www.flow.cl/api";
}
