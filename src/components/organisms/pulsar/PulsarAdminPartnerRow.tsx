import { PARTNER_IDS, PARTNER_SRC, type PartnerId } from "@/lib/pulsar/connectedPartners";

export interface PulsarAdminPartnerRowProps {
  title: string;
  partners: readonly PartnerId[];
  label: Record<PartnerId, string>;
}

export function PulsarAdminPartnerRow({ title, partners, label }: PulsarAdminPartnerRowProps) {
  const shown = PARTNER_IDS.filter((id) => partners.includes(id));
  if (shown.length === 0) return null;
  return (
    <section className="mt-10" aria-label={title}>
      <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h2>
      <ul className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
        {shown.map((id) => (
          <li key={id} className="flex items-center gap-2.5">
            <img src={PARTNER_SRC[id]} alt="" className="h-7 w-auto max-w-[5.5rem] object-contain" />
            <span className="text-sm text-[var(--color-foreground)]">{label[id]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
