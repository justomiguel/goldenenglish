import type { Dictionary } from "@/types/i18n";

type DailyClassErrors = Dictionary["dashboard"]["dailyClass"]["errors"];

export function dailyJoinErrorCopy(
  code: string,
  errors: DailyClassErrors,
): string {
  if (code === "plan") return errors.mode;
  if (code === "person") return errors.person;
  if (code === "mode") return errors.mode;
  if (code === "credentials") return errors.credentials;
  if (code === "room") return errors.room;
  if (code === "window") return errors.window;
  if (code === "daily_failed") return errors.daily_failed;
  return errors.person;
}
