ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS price_by_flow BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.events.price_by_flow IS
  'When true, each registration flow has its own price and residency pricing is not charged.';

CREATE TABLE IF NOT EXISTS public.event_registration_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  position INT NOT NULL DEFAULT 0,
  price NUMERIC(12, 2),
  field_order TEXT[] NOT NULL DEFAULT '{}',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.event_registration_flows IS
  'A registration path. Shared questions stay on the event; these rows hold the extra questions and, when price_by_flow is on, the amount.';

ALTER TABLE public.event_form_fields
  ADD COLUMN IF NOT EXISTS flow_id UUID;

ALTER TABLE public.event_form_fields
  DROP CONSTRAINT IF EXISTS event_form_fields_flow_id_fkey;

ALTER TABLE public.event_form_fields
  ADD CONSTRAINT event_form_fields_flow_id_fkey
  FOREIGN KEY (flow_id) REFERENCES public.event_registration_flows (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.event_form_fields.flow_id IS
  'Null means the extra question is shared by every flow.';

ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS registration_flow_id UUID;

ALTER TABLE public.event_attendees
  DROP CONSTRAINT IF EXISTS event_attendees_registration_flow_id_fkey;

ALTER TABLE public.event_attendees
  ADD CONSTRAINT event_attendees_registration_flow_id_fkey
  FOREIGN KEY (registration_flow_id) REFERENCES public.event_registration_flows (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS event_registration_flows_event_idx
  ON public.event_registration_flows (event_id, position)
  WHERE archived_at IS NULL;

ALTER TABLE public.event_registration_flows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_registration_flows_select_public_or_admin
  ON public.event_registration_flows;
CREATE POLICY event_registration_flows_select_public_or_admin
  ON public.event_registration_flows
  FOR SELECT TO anon, authenticated
  USING (
    (
      archived_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.events e
        WHERE e.id = event_registration_flows.event_id
          AND e.status = 'published'
          AND e.archived_at IS NULL
      )
    )
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS event_registration_flows_modify_admin
  ON public.event_registration_flows;
CREATE POLICY event_registration_flows_modify_admin
  ON public.event_registration_flows
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
