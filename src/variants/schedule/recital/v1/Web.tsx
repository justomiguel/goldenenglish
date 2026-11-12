import { GenericLandingMotion } from "@/components/organisms/generic-landing/GenericLandingMotion";
import type { ScheduleVariantProps } from "@/variants/schedule/scheduleProps";

export default function ScheduleRecital({ lines }: ScheduleVariantProps) {
  return (
    <section className="px-5 py-16" data-day-layout="recital">
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
