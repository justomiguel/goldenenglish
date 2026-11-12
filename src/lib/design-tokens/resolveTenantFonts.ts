import {
  DEFAULT_BODY_FONT_ID,
  DEFAULT_HEADING_FONT_ID,
  type DesignTokensV1,
} from "@/lib/design-tokens/designTokensV1";
import { FONT_CATALOG } from "@/lib/design-tokens/fontCatalog";

function knownId(id: string, fallback: string): string {
  return FONT_CATALOG.some((font) => font.id === id) ? id : fallback;
}

export function resolveTenantFonts(tokens: DesignTokensV1): { heading: string; body: string } {
  return {
    heading: knownId(tokens.font.heading, DEFAULT_HEADING_FONT_ID),
    body: knownId(tokens.font.body, DEFAULT_BODY_FONT_ID),
  };
}
