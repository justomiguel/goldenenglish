import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";

const EZ_CARD =
  "overflow-hidden rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-black shadow-[0_28px_70px_rgb(0_0_0_/40%)]";

export function publicEventDescriptionProseClass(
  variant: PublicEventSurfaceVariant,
): string {
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
  if (variant === "espaciozenit") {
    return `${EZ_CARD} flex h-full flex-col transition-shadow hover:shadow-[0_32px_80px_rgb(0_174_239_/12%)]`;
  }

  return "flex h-full flex-col overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-shadow hover:shadow-md";
}

export function publicEventListCardCoverClass(variant: PublicEventSurfaceVariant): string {
  return variant === "espaciozenit"
    ? "relative block aspect-[16/9] w-full shrink-0 bg-black"
    : "relative block aspect-[16/9] w-full shrink-0 bg-[var(--color-muted)]";
}

export function publicEventRegisterPageClasses(variant: PublicEventSurfaceVariant) {
  if (variant === "espaciozenit") {
    return {
      backLink:
        "inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--ez-cyan-soft)] underline decoration-[rgb(255_255_255_/25%)] underline-offset-[0.35em] transition hover:text-[var(--ez-cyan)] hover:decoration-[var(--ez-cyan)]",
      title: "text-3xl font-bold uppercase tracking-[0.08em] text-white",
      lead: "text-neutral-300",
    };
  }

  return {
    backLink:
      "inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline",
    title: "text-3xl font-bold text-[var(--color-secondary)]",
    lead: "text-[var(--color-muted-foreground)]",
  };
}

export function publicEventRegisterShellClass(variant: PublicEventSurfaceVariant): string {
  if (variant === "espaciozenit") {
    return "mx-auto max-w-3xl rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-black p-4 shadow-[0_28px_70px_rgb(0_0_0_/40%)] md:p-8";
  }

  return "mx-auto max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm";
}

export function publicEventRegisterTypography(variant: PublicEventSurfaceVariant) {
  if (variant === "espaciozenit") {
    return {
      sectionTitle: "text-base font-bold uppercase tracking-[0.1em] text-white",
      body: "text-sm text-neutral-100",
      muted: "text-sm text-neutral-400",
      hint: "text-xs text-neutral-400",
      consent: "text-sm text-neutral-200",
      price: "text-sm text-neutral-300",
    };
  }

  return {
    sectionTitle: "text-base font-semibold text-[var(--color-foreground)]",
    body: "text-sm text-[var(--color-foreground)]",
    muted: "text-sm text-[var(--color-muted-foreground)]",
    hint: "text-xs text-[var(--color-muted-foreground)]",
    consent: "text-sm text-[var(--color-foreground)]",
    price: "text-sm text-[var(--color-muted-foreground)]",
  };
}

export function publicEventRegisterSectionClass(variant: PublicEventSurfaceVariant): string {
  return variant === "espaciozenit"
    ? "space-y-2 rounded-xl border border-[rgb(0_174_239_/20%)] bg-[rgb(0_174_239_/6%)] p-3"
    : "space-y-2 rounded-xl border border-[var(--color-border)] p-3";
}

export function publicEventRegisterPanelClass(variant: PublicEventSurfaceVariant): string {
  return variant === "espaciozenit"
    ? "space-y-2 rounded-xl border border-[rgb(0_174_239_/20%)] bg-[rgb(0_174_239_/6%)] p-4"
    : "space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4";
}

export function publicEventRegisterFieldClass(variant: PublicEventSurfaceVariant): string {
  return variant === "espaciozenit"
    ? "border-[rgb(0_174_239_/30%)] bg-[#070b12] text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-[var(--ez-cyan)] focus-visible:ring-offset-black"
    : "";
}

export function publicEventRegisterLabelClass(variant: PublicEventSurfaceVariant): string {
  return variant === "espaciozenit" ? "text-neutral-200" : "";
}

export function publicEventRegisterSubmitClass(variant: PublicEventSurfaceVariant): string {
  if (variant === "espaciozenit") {
    return "inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--ez-cyan)] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-black shadow-[0_12px_36px_rgb(0_174_239_/28%)] transition hover:bg-[var(--ez-cyan-soft)] disabled:opacity-60";
  }

  return "inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] disabled:opacity-60";
}

export function publicEventRegisterPaymentOptionClass(variant: PublicEventSurfaceVariant): string {
  return variant === "espaciozenit"
    ? "flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[rgb(0_174_239_/25%)] bg-[#070b12] px-3 py-2 text-sm text-neutral-100 has-[:checked]:border-[var(--ez-cyan)] has-[:checked]:bg-[rgb(0_174_239_/10%)]"
    : "flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm";
}

export function publicEventRegisterResidencyOptionClass(variant: PublicEventSurfaceVariant): string {
  return variant === "espaciozenit"
    ? "flex cursor-pointer items-start gap-2 rounded-xl border border-[rgb(0_174_239_/25%)] bg-[#070b12] p-3 has-[:checked]:border-[var(--ez-cyan)] has-[:checked]:bg-[rgb(0_174_239_/10%)]"
    : "flex cursor-pointer items-start gap-2 rounded-md border border-[var(--color-border)] p-3 has-[:checked]:border-[var(--color-primary)]";
}

export function publicEventRegisterResidencyFieldsetClass(variant: PublicEventSurfaceVariant): string {
  return variant === "espaciozenit"
    ? "space-y-2 rounded-xl border border-[rgb(0_174_239_/20%)] bg-[rgb(0_174_239_/6%)] p-3"
    : "space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3";
}

export function publicEventRegisterUploadButtonClass(variant: PublicEventSurfaceVariant): string {
  if (variant === "espaciozenit") {
    return "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[rgb(0_174_239_/35%)] bg-black px-4 py-2 text-sm font-semibold text-[var(--ez-cyan-soft)] transition-colors hover:border-[var(--ez-cyan)] hover:bg-[rgb(0_174_239_/8%)] hover:text-[var(--ez-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ez-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";
  }

  return "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-[var(--color-background)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";
}

export function publicEventRegisterProgressClass(variant: PublicEventSurfaceVariant): string {
  return variant === "espaciozenit"
    ? "rounded-xl border border-[rgb(0_174_239_/20%)] bg-[rgb(0_174_239_/6%)] px-3 py-3"
    : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 px-3 py-3";
}
