import type { LandingBlock, LandingSectionSlug } from "@/types/theming";

/**
 * Public renderer for dynamic landing subsections.
 *
 * SSR-friendly and presentational: receives already-sorted blocks. Each kind
 * picks its own variant — see `LANDING_BLOCK_KINDS` in `types/theming` for the
 * closed catalog. To add a new kind: extend the type, add a branch here and a
 * matching label in dictionaries (PR 7).
 */
export interface LandingBlocksRendererProps {
  section: LandingSectionSlug;
  blocks: ReadonlyArray<LandingBlock>;
  locale: string;
}

interface LocalizedCopy {
  title: string | null;
  body: string | null;
}

function pickCopy(block: LandingBlock, locale: string): LocalizedCopy {
  const lc = locale.toLowerCase();
  const primary = lc.startsWith("en") ? block.copy.en : block.copy.es;
  const fallback = lc.startsWith("en") ? block.copy.es : block.copy.en;
  const title = primary.title?.trim() || fallback.title?.trim() || null;
  const body = primary.body?.trim() || fallback.body?.trim() || null;
  return { title, body };
}

function isFullWidthKind(kind: LandingBlock["kind"]): boolean {
  return kind === "feature" || kind === "cta" || kind === "divider";
}

function spanClasses(kind: LandingBlock["kind"]): string {
  return isFullWidthKind(kind) ? "sm:col-span-2" : "";
}

export function LandingBlocksRenderer({
  section,
  blocks,
  locale,
}: LandingBlocksRendererProps) {
  if (blocks.length === 0) return null;
  return (
    <div
      data-landing-blocks={section}
      className="mx-auto grid max-w-5xl gap-4 px-4 py-6 sm:grid-cols-2"
    >
      {blocks.map((block) => {
        const copy = pickCopy(block, locale);
        if (!copy.title && !copy.body) return null;
        return (
          <div key={block.id} className={spanClasses(block.kind)}>
            <BlockBody kind={block.kind} copy={copy} />
          </div>
        );
      })}
    </div>
  );
}

function BlockBody({
  kind,
  copy,
}: {
  kind: LandingBlock["kind"];
  copy: LocalizedCopy;
}) {
  switch (kind) {
    case "callout":
      return (
        <article className="rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 p-4">
          {copy.title ? (
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">
              {copy.title}
            </h3>
          ) : null}
          {copy.body ? (
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              {copy.body}
            </p>
          ) : null}
        </article>
      );
    case "quote":
      return (
        <blockquote className="rounded-[var(--layout-border-radius)] border border-[var(--color-secondary)]/40 bg-[var(--color-secondary)]/5 p-4 italic">
          {copy.body ? (
            <p className="text-base text-[var(--color-foreground)]">
              &ldquo;{copy.body}&rdquo;
            </p>
          ) : null}
          {copy.title ? (
            <footer className="mt-2 text-xs not-italic text-[var(--color-muted-foreground)]">
              — {copy.title}
            </footer>
          ) : null}
        </blockquote>
      );
    case "feature":
      return (
        <article className="flex gap-4 rounded-[var(--layout-border-radius)] border-l-4 border-[var(--color-primary)] bg-[var(--color-surface)] p-4">
          <div>
            {copy.title ? (
              <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                {copy.title}
              </h3>
            ) : null}
            {copy.body ? (
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                {copy.body}
              </p>
            ) : null}
          </div>
        </article>
      );
    case "stat":
      return (
        <article className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          {copy.title ? (
            <p className="text-3xl font-bold text-[var(--color-primary)]">
              {copy.title}
            </p>
          ) : null}
          {copy.body ? (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {copy.body}
            </p>
          ) : null}
        </article>
      );
    case "cta":
      return (
        <article className="rounded-[var(--layout-border-radius)] border border-[var(--color-secondary)]/50 bg-[var(--color-secondary)]/10 p-5 text-center">
          {copy.title ? (
            <h3 className="text-lg font-bold text-[var(--color-secondary)]">
              {copy.title}
            </h3>
          ) : null}
          {copy.body ? (
            <p className="mt-2 text-sm text-[var(--color-foreground)]">
              {copy.body}
            </p>
          ) : null}
        </article>
      );
    case "divider":
      return (
        <div className="flex items-center gap-3 py-2 text-[var(--color-muted-foreground)]">
          <span aria-hidden className="h-px flex-1 bg-[var(--color-border)]" />
          {copy.title ? (
            <span className="text-xs font-semibold uppercase tracking-wide">
              {copy.title}
            </span>
          ) : null}
          <span aria-hidden className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
      );
    case "card":
    default:
      return (
        <article className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          {copy.title ? (
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">
              {copy.title}
            </h3>
          ) : null}
          {copy.body ? (
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              {copy.body}
            </p>
          ) : null}
        </article>
      );
  }
}
