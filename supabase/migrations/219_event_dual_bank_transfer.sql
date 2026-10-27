-- 219_event_dual_bank_transfer.sql
--
-- Dual bank transfer destinations for co-organized events.
-- Stores optional two-source configuration on public.events and records
-- which transfer source and routing option the attendee chose on public.event_attendees.

BEGIN;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS bank_transfer_sources_config JSONB NULL,
  ADD COLUMN IF NOT EXISTS allow_family_discount BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS companion_require_details BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.events.bank_transfer_sources_config IS
  'Optional dual bank transfer configuration (enabled, mode, source1, source2, question/options).';
COMMENT ON COLUMN public.events.allow_family_discount IS
  'Whether the public event registration form offers the 10% institute family discount checkbox.';
COMMENT ON COLUMN public.events.companion_require_details IS
  'When allow_multiple_tickets is true: false keeps additional tickets under the primary attendee name; true asks for each companion details.';

ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS transfer_source_key TEXT NULL,
  ADD COLUMN IF NOT EXISTS transfer_source_label TEXT NULL,
  ADD COLUMN IF NOT EXISTS transfer_question_answer TEXT NULL;

ALTER TABLE public.event_attendees
  DROP CONSTRAINT IF EXISTS event_attendees_transfer_source_key_check;

ALTER TABLE public.event_attendees
  ADD CONSTRAINT event_attendees_transfer_source_key_check
  CHECK (transfer_source_key IS NULL OR transfer_source_key IN ('source_1', 'source_2', 'global'));

COMMENT ON COLUMN public.event_attendees.transfer_source_key IS
  'Selected bank transfer source key (source_1, source_2, or global) when dual transfer is enabled.';
COMMENT ON COLUMN public.event_attendees.transfer_source_label IS
  'Snapshot of the bank transfer source label at registration time.';
COMMENT ON COLUMN public.event_attendees.transfer_question_answer IS
  'Snapshot of the routing question option label answered at registration time.';

COMMIT;
