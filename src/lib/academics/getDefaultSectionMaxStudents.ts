import { loadProperties, getProperty } from "@/lib/theme/themeParser";

const KEY = "academics.section.max_students";

export function getDefaultSectionMaxStudents(): number {
  const props = loadProperties();
  const raw = getProperty(props, KEY, "28").trim();
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 28;
  return n;
}
