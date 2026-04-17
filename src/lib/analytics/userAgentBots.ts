/**
 * Curated bot directory for the admin analytics traffic breakdown.
 *
 * Aggregates the per-domain matchers (search/AI vs social/operational) into a
 * single ordered list consumed by `parseTrafficUserAgent`. Each entry maps a
 * token from the bot's `User-Agent` (case-insensitive) to a friendly label,
 * the owning vendor and a public info page so the admin can verify "who" is
 * hitting the site.
 *
 * Order matters in this concatenation: search/AI bots are listed first
 * because their tokens (e.g. `Googlebot`) are usually more discriminating
 * than the social previews (`facebookexternalhit`).
 */

import { SEARCH_AI_BOTS } from "./userAgentBotsSearchAi";
import { SOCIAL_OPS_BOTS } from "./userAgentBotsSocialOps";

export type { BotCategory, BotMatcher } from "./userAgentBotTypes";

export const BOT_MATCHERS = [...SEARCH_AI_BOTS, ...SOCIAL_OPS_BOTS];
