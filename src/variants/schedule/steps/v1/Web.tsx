import { GenericLandingMotion } from "@/components/organisms/generic-landing/GenericLandingMotion";
import { splitGenericRhythm } from "@/lib/landing/genericLandingComposition";
import type { ScheduleVariantProps } from "@/variants/schedule/scheduleProps";

export default function ScheduleSteps({ lines }: ScheduleVariantProps) {
  return (
    <section className="px-5 py-16" data-day-layout="steps">
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
