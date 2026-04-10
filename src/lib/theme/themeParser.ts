import fs from "fs";
import path from "path";

export type ThemeProperties = Record<string, string>;

const PROPERTIES_FILE = "system.properties";

function parseLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) return null;

  const key = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1).trim();
  return [key, value];
}

export function parseProperties(content: string): ThemeProperties {
  const props: ThemeProperties = {};
  for (const line of content.split("\n")) {
    const parsed = parseLine(line);
    if (parsed) {
      props[parsed[0]] = parsed[1];
    }
  }
  return props;
}

export function loadProperties(): ThemeProperties {
  const filePath = path.resolve(process.cwd(), PROPERTIES_FILE);
  const content = fs.readFileSync(filePath, "utf-8");
  return parseProperties(content);
}

export function getProperty(
  props: ThemeProperties,
  key: string,
  fallback = "",
): string {
  return props[key] ?? fallback;
}

function keyToCssVar(key: string): string {
  return `--${key.replace(/\./g, "-")}`;
}

export function toCssVariables(props: ThemeProperties): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    vars[keyToCssVar(key)] = value;
  }
  return vars;
}

export function toCssString(props: ThemeProperties): string {
  return Object.entries(toCssVariables(props))
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
}
