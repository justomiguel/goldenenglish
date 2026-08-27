import { CalendarDays } from "lucide-react";
import { SectionReferenceThumb } from "@/components/molecules/SectionReferenceThumb";
import { sectionReferenceImagePublicUrl } from "@/lib/register/sectionReferenceImage";
import { sectionScheduleWeekdayKey } from "@/lib/academics/sectionScheduleWeekdayKey";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import type { Dictionary } from "@/types/i18n";

interface SectionEnrollmentLinkCardProps {
  link: SectionEnrollmentLinkContext;
  labels: Dictionary["register"]["sectionLink"];
}

export function SectionEnrollmentLinkCard({
  link,
  labels,
}: SectionEnrollmentLinkCardProps) {
  const isFull = link.seatsRemaining === 0;
  const showSeats = link.seatsRemaining != null && link.seatsRemaining > 0;
  const seatsLabel =
    link.seatsRemaining === 1
      ? labels.seatsRemainingOne
      : labels.seatsRemainingMany.replace("{count}", String(link.seatsRemaining));
  const scheduleLabelId = "section-enrollment-link-schedule-label";

  return (
    <fieldset className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4">
      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {labels.heading}
      </legend>
      <div className="mt-1 flex items-start gap-3">
        <SectionReferenceThumb
          src={sectionReferenceImagePublicUrl(link.referenceImagePath)}
          alt={link.sectionName}
          size="md"
        />
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">
          {link.sectionName}
        </h2>
      </div>
      {link.cohortName ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{link.cohortName}</p>
      ) : null}

      <div className="mt-3 flex items-start gap-2">
        <CalendarDays
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]"
          aria-hidden
        />
        <div>
          <p
            id={scheduleLabelId}
            className="text-xs font-medium text-[var(--color-muted-foreground)]"
          >
            {labels.scheduleLabel}
          </p>
          {link.scheduleSlots.length === 0 ? (
            <p className="text-sm text-[var(--color-foreground)]">{labels.scheduleEmpty}</p>
          ) : (
            <ul
              className="mt-0.5 space-y-0.5"
              aria-labelledby={scheduleLabelId}
            >
              {link.scheduleSlots.map((slot) => (
                <li
                  key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`}
                  className="text-sm text-[var(--color-foreground)]"
                >
                  {`${labels.weekdays[sectionScheduleWeekdayKey(slot.dayOfWeek)]} ${slot.startTime}\u2013${slot.endTime}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showSeats ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          {seatsLabel}
        </p>
      ) : null}
      {isFull ? (
        <p className="mt-3 text-sm text-[var(--color-foreground)]" role="note">
          {labels.waitingListNotice}
        </p>
      ) : null}
    </fieldset>
  );
}
