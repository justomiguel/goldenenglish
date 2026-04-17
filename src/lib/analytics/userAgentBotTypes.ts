/**
 * Shared types for the curated bot directory used by the admin analytics
 * traffic breakdown. Split out so the two data files stay under the file
 * length budget defined in `.cursor/rules/03-architecture.mdc`.
 */

export type BotCategory =
  | "search"
  | "ai"
  | "social"
  | "seo"
  | "monitor"
  | "preview"
  | "feed"
  | "security"
  | "generic";

export interface BotMatcher {
  /** Token searched in the User-Agent (case-insensitive). Most bots embed their name. */
  token: string;
  label: string;
  vendor: string;
  vendorUrl: string | null;
  category: BotCategory;
}
