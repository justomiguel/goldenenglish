import type { ReactNode } from "react";

export function AdminRegistrationActionScene({
  src,
  alt,
  title,
  children,
}: {
  src: string;
  alt: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex items-start gap-3">
        <img
          src={src}
          alt={alt}
          width={640}
          height={640}
          data-stage-figure
          className="h-36 w-36 shrink-0 rounded-[var(--layout-border-radius)] object-cover"
        />
        <div data-stage-actions className="flex min-w-0 flex-1 flex-col gap-2">
          <h3 className="text-sm font-medium text-[var(--color-foreground)]">{title}</h3>
          {children}
        </div>
      </div>
    </section>
  );
}
