import type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";
import { splitGenericRhythm, type GenericDayLayout } from "@/lib/landing/genericLandingComposition";
import { GenericLandingMotion } from "@/components/organisms/generic-landing/GenericLandingMotion";

export function GenericLandingDay({
  layout,
  copy,
}: {
  layout: GenericDayLayout;
  copy: GenericLandingCopy;
}) {
  const lines = [copy.rhythmA, copy.rhythmB, copy.rhythmC];

  if (layout === "rule") {
    return (
      <section className="px-5 py-16 sm:px-8" data-day-layout={layout}>
        <ol className="mx-auto max-w-xl border-l border-[var(--color-border)] pl-8">
          {lines.map((line, index) => {
            const { mark, rest } = splitGenericRhythm(line);
            return (
              <GenericLandingMotion key={line} index={index}>
                <li className="pb-10">
                  {mark ? <p className="text-sm text-[var(--color-muted-foreground)]">{mark}</p> : null}
                  <p className="mt-1 text-xl text-[var(--color-foreground)]">{rest}</p>
                </li>
              </GenericLandingMotion>
            );
          })}
        </ol>
      </section>
    );
  }

  if (layout === "recital") {
    return (
      <section className="px-5 py-16" data-day-layout={layout}>
        <ol className="mx-auto max-w-xl">
          {lines.map((line, index) => (
            <GenericLandingMotion key={line} index={index}>
              <li className="flex gap-6 border-b border-[var(--color-border)] py-4 text-lg text-[var(--color-foreground)]">
                <span className="text-[var(--color-muted-foreground)]">{String(index + 1).padStart(2, "0")}</span>
                <span>{line}</span>
              </li>
            </GenericLandingMotion>
          ))}
        </ol>
      </section>
    );
  }

  if (layout === "steps") {
    return (
      <section className="px-5 py-16" data-day-layout={layout}>
        <ol className="mx-auto max-w-2xl space-y-10">
          {lines.map((line, index) => {
            const { mark, rest } = splitGenericRhythm(line);
            return (
              <GenericLandingMotion key={line} index={index}>
                <li>
                  <p className="text-3xl font-medium text-[var(--color-foreground)]">{mark || String(index + 1)}</p>
                  <p className="mt-2 text-lg leading-relaxed text-[var(--color-muted-foreground)]">{rest}</p>
                </li>
              </GenericLandingMotion>
            );
          })}
        </ol>
      </section>
    );
  }

  return (
    <section className="px-5 py-8 sm:px-8" data-day-layout={layout}>
      <ol className="mx-auto max-w-3xl border-y border-[var(--color-border)]">
        {lines.map((line, index) => {
          const { mark, rest } = splitGenericRhythm(line);
          return (
            <GenericLandingMotion
              key={line}
              index={index}
              className="border-b border-[var(--color-border)] last:border-b-0"
            >
              <li className="grid grid-cols-[4.5rem_1fr] items-baseline gap-4 py-5">
                <span className="text-sm text-[var(--color-muted-foreground)]">{mark}</span>
                <span className="text-lg text-[var(--color-foreground)]">{rest}</span>
              </li>
            </GenericLandingMotion>
          );
        })}
      </ol>
    </section>
  );
}
