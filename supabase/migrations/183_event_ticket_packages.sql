-- Event ticket packages: an event may sell several named tiers, each with its own
-- price, benefits and capacity. An event with at least one active package is "in
-- package mode" and its price comes from the package (D1/D2) — there is no
-- pricing_mode column to keep in sync.
-- Spec: docs/superpowers/specs/2026-08-07-event-packages-registrations-contact-student-care-design.md (§3.1)

CREATE TABLE IF NOT EXISTS public.event_ticket_packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (length(btrim(name)) > 0),
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  capacity    INT NULL CHECK (capacity > 0),
  benefits    TEXT[] NOT NULL DEFAULT '{}',
  position    INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.event_ticket_packages.capacity IS
  'Seats for this package alone; null means only the event capacity applies.';
COMMENT ON COLUMN public.event_ticket_packages.benefits IS
  'Ordered bullets shown on the public card. Not translated (A3).';
COMMENT ON COLUMN public.event_ticket_packages.archived_at IS
  'Soft archive, same convention as event_form_fields. Archived packages are not sellable.';

CREATE INDEX IF NOT EXISTS event_ticket_packages_event_position_idx
  ON public.event_ticket_packages (event_id, position, created_at);

DROP TRIGGER IF EXISTS event_ticket_packages_set_updated_at ON public.event_ticket_packages;
CREATE TRIGGER event_ticket_packages_set_updated_at
  BEFORE UPDATE ON public.event_ticket_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.event_ticket_packages ENABLE ROW LEVEL SECURITY;

-- Mirrors event_form_fields_select_public_or_admin (migration 138).
DROP POLICY IF EXISTS event_ticket_packages_select_public_or_admin ON public.event_ticket_packages;
CREATE POLICY event_ticket_packages_select_public_or_admin ON public.event_ticket_packages
  FOR SELECT TO anon, authenticated
  USING (
    (
      archived_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.events e
        WHERE e.id = event_ticket_packages.event_id
          AND e.status = 'published'
          AND e.archived_at IS NULL
      )
    )
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS event_ticket_packages_modify_admin ON public.event_ticket_packages;
CREATE POLICY event_ticket_packages_modify_admin ON public.event_ticket_packages
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Attendees: which package a seat belongs to, and which titular bought it.
ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS ticket_package_id   UUID NULL
    REFERENCES public.event_ticket_packages (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS primary_attendee_id UUID NULL
    REFERENCES public.event_attendees (id) ON DELETE CASCADE;

COMMENT ON COLUMN public.event_attendees.primary_attendee_id IS
  'Null for a titular. Set on a companion seat; cascade so a cancelled purchase takes its companions with it.';

-- A companion may not have a document or a mailbox of their own — both are
-- per-event toggles (D7) — so the two columns stop being mandatory at the table
-- level. The RPC still demands both from the titular, which is the person
-- responsible for the purchase and the one every notification is sent to.
ALTER TABLE public.event_attendees ALTER COLUMN dni_or_passport DROP NOT NULL;
ALTER TABLE public.event_attendees ALTER COLUMN email DROP NOT NULL;

-- The per-event document uniqueness now applies only to titulars. Dropping the
-- old constraint and creating the partial index happen in this one migration so
-- there is never a window without duplicate protection (A2).
ALTER TABLE public.event_attendees DROP CONSTRAINT IF EXISTS event_attendees_event_dni_unique;
CREATE UNIQUE INDEX IF NOT EXISTS event_attendees_primary_dni_uniq
  ON public.event_attendees (event_id, dni_or_passport)
  WHERE primary_attendee_id IS NULL AND dni_or_passport IS NOT NULL;
CREATE INDEX IF NOT EXISTS event_attendees_primary_attendee_idx
  ON public.event_attendees (primary_attendee_id);

-- Multi-ticket settings.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS allow_multiple_tickets       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_tickets_per_registration INT NULL
    CHECK (max_tickets_per_registration > 1),
  ADD COLUMN IF NOT EXISTS companion_collect_dni        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS companion_collect_birth_date BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS companion_collect_email      BOOLEAN NOT NULL DEFAULT false;

-- "Unlimited" must never be implicit: allowing several tickets requires a maximum.
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_multi_ticket_max_required;
ALTER TABLE public.events
  ADD CONSTRAINT events_multi_ticket_max_required
  CHECK (NOT allow_multiple_tickets OR max_tickets_per_registration IS NOT NULL);

ALTER TABLE public.event_form_fields
  ADD COLUMN IF NOT EXISTS collect_for_companions BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.event_form_fields.collect_for_companions IS
  'When true the register form asks this question for every companion seat too.';
