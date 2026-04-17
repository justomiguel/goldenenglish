import { loadProperties, type ThemeProperties } from "@/lib/theme/themeParser";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { mergeProperties } from "@/lib/theme/themeOverrides";
import type { EffectiveProperties } from "@/types/theming";

/**
 * Resolves the property map that should drive the current request:
 * `system.properties` defaults overlaid with the active site theme overrides.
 *
 * Pure helpers (`mergeProperties`, `cssVariablesBlock`) keep the merge logic
 * testable; this module only orchestrates I/O so it stays trivial and the
 * branching paths sit in unit-tested places.
 */
export async function loadEffectiveProperties(): Promise<EffectiveProperties> {
  const defaults: ThemeProperties = loadProperties();
  const active = await loadActiveTheme();
  if (!active) {
    return { properties: defaults, activeThemeSlug: null };
  }
  return {
    properties: mergeProperties(defaults, active.theme.properties),
    activeThemeSlug: active.theme.slug,
  };
}
