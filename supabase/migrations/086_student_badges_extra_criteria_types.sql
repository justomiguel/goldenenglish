-- Extends the badge_criteria_type enum with finer-grained platform-usage signals,
-- and adds a `community` badge_category for engagement / messaging badges.
-- Must commit BEFORE inserting badges that use these values (Postgres restriction
-- on ALTER TYPE ... ADD VALUE inside a transaction). The seed lives in
-- 087_student_badges_usage_seed.sql.
-- See ADR docs/adr/2026-04-student-badges-admin-catalog.md (criteria DSL extension).

ALTER TYPE public.badge_criteria_type ADD VALUE IF NOT EXISTS 'profile_avatar_set';
ALTER TYPE public.badge_criteria_type ADD VALUE IF NOT EXISTS 'profile_phone_set';
ALTER TYPE public.badge_criteria_type ADD VALUE IF NOT EXISTS 'profile_birth_date_set';
ALTER TYPE public.badge_criteria_type ADD VALUE IF NOT EXISTS 'attendance_days_total';
ALTER TYPE public.badge_criteria_type ADD VALUE IF NOT EXISTS 'messages_sent';

ALTER TYPE public.badge_category ADD VALUE IF NOT EXISTS 'community';
