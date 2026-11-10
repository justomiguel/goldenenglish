import { CalendarDays, Clock, MapPin } from "lucide-react";
import { LioraSectionHeading } from "@/components/molecules/LioraSectionHeading";
import {
  LIORA_SATURDAY_SCHEDULE,
  type LioraSedeSchedule,
} from "@/lib/landing/lioraSchedule";

interface LandingLioraHorariosSectionProps {
  /** Reads `dict.landing.liora.<path>`. */
  t: (path: string) => string;
}

function SedeBlock({
  schedule,
  t,
}: {
  schedule: LioraSedeSchedule;
  t: (path: string) => string;
}) {
  const sedeName = t(`sedes.${schedule.sedeKey}.name`);
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--liora-line)] bg-white">
      <h3 className="liora-schedule-sede flex items-center gap-2 px-5 py-3 text-xs font-medium uppercase tracking-[0.3em]">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.5} />
        {sedeName}
      </h3>
      <ul className="divide-y divide-[var(--liora-line)]">
        {schedule.slots.map((slot) => (
          <li
            key={`${schedule.sedeKey}-${slot.time}-${slot.classKey}`}
            className="liora-schedule-row flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
          >
            <p className="flex items-center gap-2 text-sm font-medium tracking-wide text-[var(--liora-ink)] sm:w-40 sm:shrink-0">
              <Clock
                className="h-4 w-4 shrink-0 text-[var(--liora-rose-deep)]"
                aria-hidden
                strokeWidth={1.5}
              />
              {slot.time}
            </p>
            <p className="min-w-0">
              <span className="block font-[family-name:var(--font-liora-display)] text-lg tracking-wide text-[var(--liora-ink)]">
                {t(`clases.${slot.classKey}.title`)}
              </span>
              <span className="block text-sm text-[var(--liora-rose-deep)]">
                {t("clases.ageLabel").replace("{ages}", slot.ages)}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingLioraHorariosSection({
  t,
}: LandingLioraHorariosSectionProps) {
  return (
    <section
      id="horarios"
      className="liora-section liora-band-blush"
      data-liora-anchor="horarios"
      data-liora-side="start"
    >
      <div className="relative z-10 mx-auto max-w-6xl">
        <LioraSectionHeading
          align="start"
          title={t("horarios.sectionTitle")}
          script={t("horarios.titleScript")}
          lead={t("horarios.lead")}
        />
        <p className="liora-pill mt-6 gap-2">
          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.5} />
          {t("horarios.dayLabel")}
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {LIORA_SATURDAY_SCHEDULE.map((schedule) => (
            <SedeBlock key={schedule.sedeKey} schedule={schedule} t={t} />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[var(--liora-ink-soft)]">
          {t("horarios.note")}
        </p>
      </div>
    </section>
  );
}
