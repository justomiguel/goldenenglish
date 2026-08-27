import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";

export function publicEventDetailHeroChrome(variant: PublicEventSurfaceVariant) {
  if (variant === "nago") {
    return {
      backLink:
        "inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--nago-gold)] underline decoration-[rgb(201_162_39_/35%)] underline-offset-[0.35em] transition hover:text-[var(--nago-gold-soft)] hover:decoration-[var(--nago-gold-soft)]",
      cover: "overflow-hidden rounded-[14px] border border-[rgb(201_162_39_/35%)] bg-black",
      untitled:
        "overflow-hidden rounded-[14px] border border-[rgb(201_162_39_/35%)] border-l-4 border-l-[var(--nago-gold)] bg-black p-6 md:p-8",
      eyebrow: "text-xs font-semibold uppercase tracking-[0.22em] text-[var(--nago-gold)]",
      views: "mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--nago-ink-muted)]",
      title: "uppercase tracking-[0.06em] text-[var(--nago-heading-solid)]",
    };
  }
  if (variant === "espaciozenit") {
    return {
      backLink:
        "inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--ez-cyan-soft)] underline decoration-[rgb(255_255_255_/25%)] underline-offset-[0.35em] transition hover:text-[var(--ez-cyan)] hover:decoration-[var(--ez-cyan)]",
      cover: "overflow-hidden rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-black",
      untitled:
        "overflow-hidden rounded-[22px] border border-[rgb(0_174_239_/35%)] border-l-4 border-l-[var(--ez-cyan)] bg-black p-6 md:p-8",
      eyebrow: "text-xs font-bold uppercase tracking-[0.22em] text-[var(--ez-cyan)]",
      views: "mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-400",
      title: "uppercase tracking-[0.06em] text-white",
    };
  }
  return {
    backLink:
      "inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline",
    cover:
      "overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40",
    untitled:
      "overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] border-l-4 border-l-[var(--color-secondary)] bg-[var(--color-surface)] p-6 shadow-sm md:p-8",
    eyebrow: "text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-secondary)]",
    views: "mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-muted-foreground)]",
    title: "text-[var(--color-secondary)]",
  };
}

export function publicEventDetailPanelChrome(variant: PublicEventSurfaceVariant) {
  if (variant === "nago") {
    return {
      aside:
        "overflow-hidden rounded-[14px] border border-[rgb(201_162_39_/35%)] bg-black shadow-[0_28px_70px_rgb(0_0_0_/40%)]",
      header: "border-b border-[rgb(201_162_39_/20%)] px-4 py-3",
      headerTitle:
        "font-[family-name:var(--font-nago-display)] text-sm font-semibold uppercase tracking-[0.12em] text-[var(--nago-heading-solid)]",
      row: "flex gap-3 border-t border-[rgb(201_162_39_/20%)] px-4 py-4 first:border-t-0",
      icon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(201_162_39_/12%)] text-[var(--nago-gold)]",
      label: "text-xs font-medium uppercase tracking-wide text-[var(--nago-ink-muted)]",
      value: "mt-1 text-sm font-medium leading-snug text-[var(--nago-ink)]",
      footer: "border-t border-[rgb(201_162_39_/20%)] p-4",
      cta: "nago-btn nago-btn-solid inline-flex min-h-[44px] w-full items-center justify-center gap-2 px-4 py-3",
    };
  }
  if (variant === "espaciozenit") {
    return {
      aside:
        "overflow-hidden rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-black shadow-[0_28px_70px_rgb(0_0_0_/40%)]",
      header: "border-b border-[rgb(0_174_239_/20%)] px-4 py-3",
      headerTitle: "text-sm font-bold uppercase tracking-[0.12em] text-white",
      row: "flex gap-3 border-t border-[rgb(0_174_239_/20%)] px-4 py-4 first:border-t-0",
      icon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(0_174_239_/12%)] text-[var(--ez-cyan)]",
      label: "text-xs font-medium uppercase tracking-wide text-neutral-400",
      value: "mt-1 text-sm font-medium leading-snug text-neutral-100",
      footer: "border-t border-[rgb(0_174_239_/20%)] p-4",
      cta: "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--ez-cyan)] px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-black shadow-[0_12px_36px_rgb(0_174_239_/28%)] transition hover:bg-[var(--ez-cyan-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ez-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
    };
  }
  return {
    aside:
      "overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm",
    header: "border-b border-[var(--color-border)] bg-[var(--color-muted)]/30 px-4 py-3",
    headerTitle: "text-sm font-semibold text-[var(--color-foreground)]",
    row: "flex gap-3 border-t border-[var(--color-border)] px-4 py-4 first:border-t-0",
    icon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-muted)] text-[var(--color-secondary)]",
    label: "text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]",
    value: "mt-1 text-sm font-medium leading-snug text-[var(--color-foreground)]",
    footer: "border-t border-[var(--color-border)] p-4",
    cta: "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
  };
}
