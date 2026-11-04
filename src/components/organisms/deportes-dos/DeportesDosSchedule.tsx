import { GenericSlotLead } from "@/components/organisms/generic-landing/GenericSlotLead";
import type { Dictionary } from "@/types/i18n";
import styles from "./deportesDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["deportes2"];

export function DeportesDosSchedule({
  copy,
  discipline,
  level,
  onDiscipline,
  onLevel,
  lead,
}: {
  copy: Copy;
  discipline: string;
  level: string;
  onDiscipline: (id: string) => void;
  onLevel: (id: string) => void;
  lead?: { title: string; body: string };
}) {
  const slots = copy.slots.filter(
    (slot) =>
      (discipline === "" || slot.discipline === discipline) &&
      (level === "all" || slot.level === level),
  );
  return (
    <section id="niveles" className={styles.block}>
      {lead ? <GenericSlotLead section="niveles" title={lead.title} body={lead.body} /> : null}
      <h2 className="text-4xl font-semibold tracking-tight">{copy.scheduleTitle}</h2>
      <div className="mt-6 flex flex-wrap gap-3">
        <Filter active={discipline === ""} onClick={() => onDiscipline("")} label={copy.nav.disciplinas} />
        {copy.disciplines.map((item) => (
          <Filter key={item.id} active={discipline === item.id} onClick={() => onDiscipline(item.id)} label={item.name} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <Filter active={level === "all"} onClick={() => onLevel("all")} label={copy.levelAll} />
        {copy.levels.map((item) => (
          <Filter key={item.id} active={level === item.id} onClick={() => onLevel(item.id)} label={item.label} />
        ))}
      </div>
      <ul className="mt-8">
        {slots.map((slot) => (
          <li key={`${slot.discipline}-${slot.when}`} className="grid gap-1 border-t border-[var(--color-border)] py-4 md:grid-cols-3">
            <span>{slot.when}</span>
            <span>{copy.disciplines.find((item) => item.id === slot.discipline)?.name}</span>
            <span className="text-[var(--color-muted-foreground)]">{slot.place}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Filter({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 border-b px-1 text-sm font-semibold ${
        active ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent"
      }`}
    >
      {label}
    </button>
  );
}
