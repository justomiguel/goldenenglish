export function duplicateEventTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed ? `${trimmed} (copia)` : "copia";
}

/** Picks a free slug. `taken` holds the base slug and `base-N` slugs that already exist. */
export function pickDuplicateEventSlug(base: string, taken: ReadonlySet<string>): string {
  const root = base || "event";
  if (!taken.has(root)) return root;
  for (let index = 2; index < 100; index += 1) {
    const candidate = `${root}-${index}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${root}-100`;
}

export interface DuplicateEventSource {
  title: string;
  description: string;
  event_date: string;
  location: string | null;
  section_id: string | null;
  private_to_section: boolean;
  capacity: number;
  price: number | null;
  price_local: number | null;
  price_non_local: number | null;
  currency: string;
  default_locale: string;
  cover_image_path: string | null;
  bank_transfer_instructions: string | null;
  collect_birth_date: boolean;
  require_phone: boolean;
  require_birth_date: boolean;
  registration_field_order: string[];
  price_by_flow: boolean;
  allow_multiple_tickets: boolean;
  max_tickets_per_registration: number | null;
  companion_collect_dni: boolean;
  companion_collect_birth_date: boolean;
  companion_collect_email: boolean;
}

export function buildDuplicateEventInsert(
  source: DuplicateEventSource,
  input: { actorId: string; slug: string; title: string },
) {
  return {
    title: input.title,
    description: source.description,
    event_date: source.event_date,
    location: source.location,
    section_id: source.section_id,
    private_to_section: source.private_to_section,
    capacity: source.capacity,
    price: source.price,
    price_local: source.price_local,
    price_non_local: source.price_non_local,
    currency: source.currency,
    default_locale: source.default_locale,
    cover_image_path: source.cover_image_path,
    bank_transfer_instructions: source.bank_transfer_instructions,
    collect_birth_date: source.collect_birth_date,
    require_phone: source.require_phone,
    require_birth_date: source.require_birth_date,
    registration_field_order: source.registration_field_order,
    price_by_flow: source.price_by_flow,
    allow_multiple_tickets: source.allow_multiple_tickets,
    max_tickets_per_registration: source.max_tickets_per_registration,
    companion_collect_dni: source.companion_collect_dni,
    companion_collect_birth_date: source.companion_collect_birth_date,
    companion_collect_email: source.companion_collect_email,
    slug: input.slug,
    status: "draft" as const,
    show_on_home: false,
    view_count: 0,
    created_by: input.actorId,
    published_at: null,
    archived_at: null,
  };
}

export function remapDuplicateFlowId(
  flowId: string | null,
  flowIds: ReadonlyMap<string, string>,
): string | null {
  if (!flowId) return null;
  return flowIds.get(flowId) ?? null;
}
