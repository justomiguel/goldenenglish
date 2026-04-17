import {
  LANDING_BLOCK_KINDS,
  LANDING_BLOCKS_PER_SECTION_CAP,
  LANDING_BLOCKS_PER_TEMPLATE_CAP,
  LANDING_SECTION_SLUGS,
  SITE_THEME_KINDS,
  type LandingBlock,
  type LandingBlockKind,
  type LandingBlockLocaleCopy,
  type LandingSectionSlug,
  type SiteThemeKind,
} from "@/types/theming";

/**
 * Pure helpers for the dynamic landing blocks (PR 6).
 *
 * The runtime layer must never trust raw JSONB from the DB: a malformed row
 * (manual edit, partial migration, future schema drift) shouldn't break the
 * public landing. These helpers normalize every parsing/saving boundary.
 */

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 600;
const MAX_MEDIA_PATH_LENGTH = 240;

export function isLandingBlockKind(value: unknown): value is LandingBlockKind {
  return (
    typeof value === "string" &&
    (LANDING_BLOCK_KINDS as ReadonlyArray<string>).includes(value)
  );
}

export function isLandingSectionSlug(
  value: unknown,
): value is LandingSectionSlug {
  return (
    typeof value === "string" &&
    (LANDING_SECTION_SLUGS as ReadonlyArray<string>).includes(value)
  );
}

export function isSiteThemeKind(value: unknown): value is SiteThemeKind {
  return (
    typeof value === "string" &&
    (SITE_THEME_KINDS as ReadonlyArray<string>).includes(value)
  );
}

function trimToMax(raw: unknown, max: number): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function parseLocaleCopy(raw: unknown): LandingBlockLocaleCopy {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const title = trimToMax(obj.title, MAX_TITLE_LENGTH);
  const body = trimToMax(obj.body, MAX_BODY_LENGTH);
  const out: LandingBlockLocaleCopy = {};
  if (title !== undefined) out.title = title;
  if (body !== undefined) out.body = body;
  return out;
}

function parseMediaPath(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > MAX_MEDIA_PATH_LENGTH) return undefined;
  return trimmed;
}

/**
 * Parses a raw `blocks` JSONB into the canonical `LandingBlock[]` shape:
 *  - drops entries with invalid id / section / kind,
 *  - drops entries with no copy in either locale (avoids empty cards leaking
 *    into the public landing),
 *  - clamps oversize strings,
 *  - re-numbers `position` per section so renderers get a contiguous order.
 */
export function parseLandingBlocks(raw: unknown): ReadonlyArray<LandingBlock> {
  if (!Array.isArray(raw)) return [];
  const valid: LandingBlock[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const candidate = entry as Record<string, unknown>;
    const id =
      typeof candidate.id === "string" && candidate.id.trim().length > 0
        ? candidate.id.trim()
        : null;
    if (!id) continue;
    if (!isLandingSectionSlug(candidate.section)) continue;
    if (!isLandingBlockKind(candidate.kind)) continue;
    const copySource =
      candidate.copy && typeof candidate.copy === "object"
        ? (candidate.copy as Record<string, unknown>)
        : {};
    const copy = {
      es: parseLocaleCopy(copySource.es),
      en: parseLocaleCopy(copySource.en),
    };
    const hasAnyCopy =
      Boolean(copy.es.title || copy.es.body) ||
      Boolean(copy.en.title || copy.en.body);
    if (!hasAnyCopy) continue;
    const positionRaw = Number(candidate.position);
    const position = Number.isFinite(positionRaw) ? positionRaw : valid.length;
    const mediaPath = parseMediaPath(candidate.mediaPath);
    valid.push({
      id,
      section: candidate.section,
      kind: candidate.kind,
      position,
      copy,
      ...(mediaPath ? { mediaPath } : {}),
    });
  }
  return normalizeBlockPositions(valid);
}

/** Re-orders blocks per section by current `position` and re-numbers them
 *  starting from 0 so renderers and "move up/down" UIs stay simple. */
export function normalizeBlockPositions(
  blocks: ReadonlyArray<LandingBlock>,
): ReadonlyArray<LandingBlock> {
  const bySection = new Map<LandingSectionSlug, LandingBlock[]>();
  for (const block of blocks) {
    const arr = bySection.get(block.section) ?? [];
    arr.push(block);
    bySection.set(block.section, arr);
  }
  const out: LandingBlock[] = [];
  for (const section of LANDING_SECTION_SLUGS) {
    const arr = bySection.get(section);
    if (!arr) continue;
    arr.sort((a, b) => a.position - b.position);
    arr.forEach((block, index) => {
      out.push({ ...block, position: index });
    });
  }
  return out;
}

/** Groups blocks by section, ready for renderers and section editor pages. */
export function groupBlocksBySection(
  blocks: ReadonlyArray<LandingBlock>,
): Readonly<Record<LandingSectionSlug, ReadonlyArray<LandingBlock>>> {
  const out: Record<LandingSectionSlug, LandingBlock[]> = {
    inicio: [],
    historia: [],
    oferta: [],
    modalidades: [],
    niveles: [],
    certificaciones: [],
  };
  for (const block of blocks) out[block.section].push(block);
  for (const section of LANDING_SECTION_SLUGS) {
    out[section].sort((a, b) => a.position - b.position);
  }
  return out;
}

/**
 * Persistence sanitizer used by server actions. Returns the same blocks
 * trimmed/normalized, after enforcing the per-template + per-section caps.
 * Throws nothing: caller decides how to react when caps are exceeded
 * (server actions return an `invalid_input` code).
 */
export interface SanitizeBlocksResult {
  ok: true;
  blocks: ReadonlyArray<LandingBlock>;
}

export interface SanitizeBlocksFailure {
  ok: false;
  reason: "too_many_total" | "too_many_in_section";
  section?: LandingSectionSlug;
}

export function sanitizeLandingBlocksForPersistence(
  raw: unknown,
): SanitizeBlocksResult | SanitizeBlocksFailure {
  const parsed = parseLandingBlocks(raw);
  if (parsed.length > LANDING_BLOCKS_PER_TEMPLATE_CAP) {
    return { ok: false, reason: "too_many_total" };
  }
  const grouped = groupBlocksBySection(parsed);
  for (const section of LANDING_SECTION_SLUGS) {
    if (grouped[section].length > LANDING_BLOCKS_PER_SECTION_CAP) {
      return { ok: false, reason: "too_many_in_section", section };
    }
  }
  return { ok: true, blocks: parsed };
}

/**
 * Move a block one step up (`-1`) or down (`+1`) inside its section. Returns
 * the next blocks array (already normalized) so the caller can persist it
 * directly. When the block is at the boundary or not found the original
 * sorted-and-normalized list is returned (idempotent — safe to call
 * speculatively from the UI).
 */
export function moveLandingBlock(
  blocks: ReadonlyArray<LandingBlock>,
  blockId: string,
  direction: -1 | 1,
): ReadonlyArray<LandingBlock> {
  const sorted = normalizeBlockPositions(blocks);
  const target = sorted.find((block) => block.id === blockId);
  if (!target) return sorted;
  const sameSection = sorted.filter((block) => block.section === target.section);
  const indexInSection = sameSection.findIndex((block) => block.id === blockId);
  const swapWith = sameSection[indexInSection + direction];
  if (!swapWith) return sorted;
  const swapped = sorted.map((block) => {
    if (block.id === target.id) return { ...block, position: swapWith.position };
    if (block.id === swapWith.id) return { ...block, position: target.position };
    return block;
  });
  return normalizeBlockPositions(swapped);
}
