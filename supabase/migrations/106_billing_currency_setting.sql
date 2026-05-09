-- System-wide billing currency setting.
-- All billing displays and new fee plans use this currency.
-- Existing section_fee_plans.currency column is preserved for historical data but ignored.

INSERT INTO public.site_settings (key, value)
VALUES ('billing_currency', '"USD"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Expose billing_currency to authenticated reads (admin policy already covers all).
-- Update the public select policy to include this key if needed for non-admin reads.
-- For now, only admins need to read/write this setting (existing site_settings_all_admin covers it).
