import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";

const EZ_CARD =
  "overflow-hidden rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-black shadow-[0_28px_70px_rgb(0_0_0_/40%)]";

const NAGO_CARD =
  "overflow-hidden rounded-[14px] border border-[rgb(201_162_39_/35%)] bg-black shadow-[0_28px_70px_rgb(0_0_0_/40%)]";

export function publicEventDescriptionProseClass(
  variant: PublicEventSurfaceVariant,
): string {
  if (variant === "nago") {
    return [
      "prose prose-invert max-w-none text-[var(--nago-ink)]",
      "[&_p]:text-justify [&_p]:leading-relaxed [&_p+p]:mt-4",
      "[&_a]:text-[var(--nago-gold)] [&_a]:underline [&_a]:decoration-[rgb(201_162_39_/45%)]",
      "[&_iframe]:hidden",
      "[&_img]:mt-8 [&_img]:mb-8 [&_img]:max-w-full [&_img]:rounded-[14px] [&_img]:border [&_img]:border-[rgb(201_162_39_/25%)]",
      "[&_strong]:text-[var(--nago-heading-solid)] [&_li]:text-[var(--nago-ink)]",
    ].join(" ");
  }

  if (variant === "espaciozenit") {
    return [
      "prose prose-invert max-w-none text-neutral-200",
      "[&_p]:text-justify [&_p]:leading-relaxed [&_p+p]:mt-4",
      "[&_a]:text-[var(--ez-cyan-soft)] [&_a]:underline [&_a]:decoration-[rgb(0_174_239_/45%)]",
      "[&_iframe]:hidden",
      "[&_img]:mt-8 [&_img]:mb-8 [&_img]:max-w-full [&_img]:rounded-[22px] [&_img]:border [&_img]:border-[rgb(0_174_239_/25%)]",
      "[&_strong]:text-white [&_li]:text-neutral-200",
    ].join(" ");
  }

  return [
    "prose prose-neutral max-w-none text-[var(--color-foreground)]",
    "[&_p]:text-justify [&_p]:leading-relaxed [&_p+p]:mt-4",
    "[&_a]:text-[var(--color-primary)] [&_a]:underline [&_iframe]:hidden",
    "[&_img]:mt-8 [&_img]:mb-8 [&_img]:max-w-full [&_img]:rounded-[var(--layout-border-radius)]",
  ].join(" ");
}

export function publicEventListPageHeaderClasses(variant: PublicEventSurfaceVariant) {
  if (variant === "nago") {
    return {
      title:
        "font-[family-name:var(--font-nago-display)] text-3xl font-semibold uppercase tracking-[0.08em] text-[var(--nago-heading-solid)]",
      lead: "max-w-2xl text-[var(--nago-ink-muted)]",
    };
  }

  if (variant === "espaciozenit") {
    return {
      title: "text-3xl font-bold uppercase tracking-[0.08em] text-white",
      lead: "max-w-2xl text-neutral-300",
    };
  }

  return {
    title: "text-3xl font-bold text-[var(--color-secondary)]",
    lead: "max-w-2xl text-[var(--color-muted-foreground)]",
  };
}

export function publicEventListCardRootClass(variant: PublicEventSurfaceVariant): string {
  if (variant === "nago") {
    return `${NAGO_CARD} flex h-full flex-col transition-shadow hover:shadow-[0_32px_80px_rgb(201_162_39_/12%)]`;
  }

  if (variant === "espaciozenit") {
    return `${EZ_CARD} flex h-full flex-col transition-shadow hover:shadow-[0_32px_80px_rgb(0_174_239_/12%)]`;
  }

  return "flex h-full flex-col overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-shadow hover:shadow-md";
}

export function publicEventListCardCoverClass(variant: PublicEventSurfaceVariant): string {
  if (variant === "nago" || variant === "espaciozenit") {
    return "relative block aspect-[16/9] w-full shrink-0 bg-black";
  }
  return "relative block aspect-[16/9] w-full shrink-0 bg-[var(--color-muted)]";
}

export function publicEventListCardChrome(variant: PublicEventSurfaceVariant) {
  if (variant === "nago") {
    return {
      title: "text-lg font-semibold leading-snug text-[var(--nago-heading-solid)]",
      titleLink: "hover:text-[var(--nago-gold)] hover:underline",
      excerpt: "mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--nago-ink-muted)]",
      metaBox: "rounded-xl border border-[rgb(201_162_39_/20%)] bg-[rgb(201_162_39_/6%)] px-3 py-2.5",
      metaLabel:
        "inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--nago-ink-muted)]",
      metaValue: "mt-1 text-sm font-medium leading-snug text-[var(--nago-ink)]",
      location: "mt-2 inline-flex items-start gap-1.5 text-xs text-[var(--nago-ink-muted)]",
      viewDetail: "nago-btn mt-4 w-full",
    };
  }
  if (variant === "espaciozenit") {
    return {
      title: "text-lg font-semibold leading-snug text-white",
      titleLink: "hover:text-[var(--ez-cyan-soft)] hover:underline",
      excerpt: "mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-neutral-300",
      metaBox: "rounded-xl border border-[rgb(0_174_239_/20%)] bg-[rgb(0_174_239_/6%)] px-3 py-2.5",
      metaLabel:
        "inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400",
      metaValue: "mt-1 text-sm font-medium leading-snug text-neutral-100",
      location: "mt-2 inline-flex items-start gap-1.5 text-xs text-neutral-400",
      viewDetail:
        "mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[rgb(0_174_239_/35%)] bg-black px-4 py-2.5 text-sm font-bold uppercase tracking-[0.08em] text-[var(--ez-cyan-soft)] transition-colors hover:border-[var(--ez-cyan)] hover:bg-[rgb(0_174_239_/8%)] hover:text-[var(--ez-cyan)]",
    };
  }
  return {
    title: "text-lg font-semibold leading-snug text-[var(--color-foreground)]",
    titleLink: "hover:text-[var(--color-primary)] hover:underline",
    excerpt: "mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]",
    metaBox:
      "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/25 px-3 py-2.5",
    metaLabel:
      "inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]",
    metaValue: "mt-1 text-sm font-medium leading-snug text-[var(--color-foreground)]",
    location: "mt-2 inline-flex items-start gap-1.5 text-xs text-[var(--color-muted-foreground)]",
    viewDetail:
      "mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)]/40",
  };
}

export function publicEventPriceChrome(variant: PublicEventSurfaceVariant) {
  if (variant === "nago") {
    return {
      featured: "text-2xl font-semibold tracking-tight text-[var(--nago-gold)]",
      compact: "text-sm font-semibold text-[var(--nago-ink)]",
      label: "text-xs font-medium uppercase tracking-wide text-[var(--nago-ink-muted)]",
      featuredAmount: "text-lg font-semibold text-[var(--nago-heading-solid)]",
    };
  }
  if (variant === "espaciozenit") {
    return {
      featured: "text-2xl font-semibold tracking-tight text-[var(--ez-cyan-soft)]",
      compact: "text-sm font-semibold text-neutral-100",
      label: "text-xs font-medium uppercase tracking-wide text-neutral-400",
      featuredAmount: "text-lg font-semibold text-white",
    };
  }
  return {
    featured: "text-2xl font-semibold tracking-tight text-[var(--color-secondary)]",
    compact: "text-sm font-semibold text-[var(--color-foreground)]",
    label: "text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]",
    featuredAmount: "text-lg font-semibold text-[var(--color-foreground)]",
  };
}
