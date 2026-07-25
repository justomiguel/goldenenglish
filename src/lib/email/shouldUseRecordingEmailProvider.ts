/**
 * Pure env gate: isolated e2e always records; optional EMAIL_PROVIDER=recording for debug.
 */
export function shouldUseRecordingEmailProvider(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const target = (env.GE_DEV_TARGET ?? "").trim().toLowerCase();
  if (target === "e2e") return true;
  const provider = (env.EMAIL_PROVIDER ?? "").trim().toLowerCase();
  return provider === "recording";
}
