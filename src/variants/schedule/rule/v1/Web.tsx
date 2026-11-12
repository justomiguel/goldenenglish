import { GenericLandingMotion } from "@/components/organisms/generic-landing/GenericLandingMotion";
import { splitGenericRhythm } from "@/lib/landing/genericLandingComposition";
import type { ScheduleVariantProps } from "@/variants/schedule/scheduleProps";

export default function ScheduleRule({ lines }: ScheduleVariantProps) {
  return (
    <section className="px-5 py-16 sm:px-8" data-day-layout="rule">
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
