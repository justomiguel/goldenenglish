import { GenericLandingMotion } from "@/components/organisms/generic-landing/GenericLandingMotion";
import { splitGenericRhythm } from "@/lib/landing/genericLandingComposition";
import type { ScheduleVariantProps } from "@/variants/schedule/scheduleProps";

export default function ScheduleRows({ lines }: ScheduleVariantProps) {
  return (
    <section className="px-5 py-8 sm:px-8" data-day-layout="rows">
      <ol className="mx-auto max-w-3xl border-y border-[var(--color-border)]">
        {lines.map((line, index) => {
          const { mark, rest } = splitGenericRhythm(line);
          return (
            <GenericLandingMotion key={line} index={index} className="border-b border-[var(--color-border)] last:border-b-0">
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
