-- Per-event bank transfer destination / account details shown on public registration.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS bank_transfer_instructions TEXT NULL;

COMMENT ON COLUMN public.events.bank_transfer_instructions IS
  'Plain-text instructions for bank transfer payments (account, holder, reference). Shown on public registration when transfer is selected.';
