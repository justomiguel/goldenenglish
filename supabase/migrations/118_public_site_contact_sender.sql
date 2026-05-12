-- Enum only: Postgres forbids using a new enum label in the same transaction that adds it (55P04).
-- Profile/auth bootstrap lives in 119_public_site_contact_sender_profile.sql.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'site_contact';
