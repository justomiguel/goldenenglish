import { loadProperties, getProperty } from "@/lib/theme/themeParser";

const KEY = "academics.teacherPortal.allowedProfileRoles";

export function getTeacherPortalAllowedRoles(): readonly string[] {
  const props = loadProperties();
  const raw = getProperty(props, KEY, "teacher").trim();
  if (!raw) return ["teacher"];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
