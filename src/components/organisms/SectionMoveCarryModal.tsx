"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import type { SectionMoveCarryFacts } from "@/lib/academics/loadSectionMoveCarryFacts";
import {
  DEFAULT_SECTION_MOVE_CARRY,
  listSectionMoveCollisions,
  planSectionMoveCarry,
  type CarryChoice,
  type CarryResolution,
  type SectionMoveCarryFlags,
  type SectionMoveCollision,
} from "@/lib/academics/planSectionMoveCarry";
import {
  formatCarryCollisionDetail,
  sectionMoveCarryFailureMessage,
} from "@/lib/academics/sectionMoveCarryFailureMessage";
import { useAppSurface } from "@/hooks/useAppSurface";

export type SectionMoveCarryCopy = {
  title: string;
  lead: string;
  payments: string;
  scholarships: string;
  enrollmentFee: string;
  annualSettlement: string;
  attendance: string;
  grades: string;
  leave: string;
  replace: string;
  confirm: string;
  cancel: string;
  collisionLead: string;
};

const FLAG_KEYS = [
  "payments",
  "scholarships",
  "enrollmentFee",
  "annualSettlement",
  "attendance",
  "grades",
] as const satisfies readonly (keyof SectionMoveCarryFlags)[];

export function SectionMoveCarryModal({
  open,
  locale,
  copy,
  missingChoice,
  unknownError,
  facts,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  locale: string;
  copy: SectionMoveCarryCopy;
  missingChoice: string;
  unknownError: string;
  facts: SectionMoveCarryFacts | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (flags: SectionMoveCarryFlags, choices: CarryResolution[]) => void;
}) {
  const narrow = useAppSurface() !== "web-desktop";
  const [flags, setFlags] = useState<SectionMoveCarryFlags>(DEFAULT_SECTION_MOVE_CARRY);
  const [choices, setChoices] = useState<Record<string, CarryChoice>>({});
  const [error, setError] = useState<string | null>(null);
  const [seenOpen, setSeenOpen] = useState(open);
  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) {
      setFlags(DEFAULT_SECTION_MOVE_CARRY);
      setChoices({});
      setError(null);
    }
  }
  const collisions = useMemo(() => {
    if (!facts) return [];
    return listSectionMoveCollisions({ flags, ...facts });
  }, [facts, flags]);

  function setChoice(originId: string, choice: CarryChoice) {
    setChoices((current) => ({ ...current, [originId]: choice }));
  }

  function confirm() {
    if (!facts) return;
    const picked: CarryResolution[] = collisions.map((row) => ({
      originId: row.originId,
      choice: choices[row.originId] ?? "leave",
    })).filter((row) => choices[row.originId] === "leave" || choices[row.originId] === "replace");
    const planned = planSectionMoveCarry({ flags, ...facts, choices: picked });
    if (!planned.ok) {
      setError(
        sectionMoveCarryFailureMessage(
          planned.code,
          formatCarryCollisionDetail(planned.collision, locale),
          { carry_choice_missing: missingChoice },
          unknownError,
        ),
      );
      return;
    }
    setError(null);
    onConfirm(flags, picked);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
      titleId="section-move-carry-title"
      title={copy.title}
      disableClose={busy}
    >
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.lead}</p>
      <fieldset className="mt-4 flex flex-col gap-2">
        {FLAG_KEYS.map((key) => (
          <label key={key} className="flex min-h-11 items-center gap-2 text-sm text-[var(--color-foreground)]">
            <input
              type="checkbox"
              checked={flags[key]}
              disabled={busy}
              onChange={(event) => setFlags((current) => ({ ...current, [key]: event.target.checked }))}
            />
            {copy[key]}
          </label>
        ))}
      </fieldset>
      {collisions.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm text-[var(--color-foreground)]">{copy.collisionLead}</p>
          {collisions.map((row) => (
            <CollisionRow
              key={row.originId}
              row={row}
              locale={locale}
              copy={copy}
              choice={choices[row.originId]}
              disabled={Boolean(busy)}
              onChoice={setChoice}
            />
          ))}
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}
      <div className={`mt-6 flex gap-2 ${narrow ? "flex-col" : "justify-end"}`}>
        <Button type="button" variant="ghost" className={narrow ? "min-h-11 w-full" : undefined} disabled={busy} onClick={onClose}>
          <X className="h-4 w-4" aria-hidden />
          {copy.cancel}
        </Button>
        <Button type="button" className={narrow ? "min-h-11 w-full" : undefined} isLoading={busy} disabled={busy || !facts} onClick={confirm}>
          <ArrowRightLeft className="h-4 w-4" aria-hidden />
          {copy.confirm}
        </Button>
      </div>
    </Modal>
  );
}

function CollisionRow({
  row,
  locale,
  copy,
  choice,
  disabled,
  onChoice,
}: {
  row: SectionMoveCollision;
  locale: string;
  copy: SectionMoveCarryCopy;
  choice: CarryChoice | undefined;
  disabled: boolean;
  onChoice: (originId: string, choice: CarryChoice) => void;
}) {
  const detail = formatCarryCollisionDetail(row, locale);
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm text-[var(--color-foreground)]">{detail}</legend>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="radio" name={row.originId} checked={choice === "leave"} disabled={disabled} onChange={() => onChoice(row.originId, "leave")} />
        {copy.leave}
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="radio" name={row.originId} checked={choice === "replace"} disabled={disabled} onChange={() => onChoice(row.originId, "replace")} />
        {copy.replace}
      </label>
    </fieldset>
  );
}
