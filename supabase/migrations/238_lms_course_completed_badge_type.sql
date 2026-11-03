-- New enum values cannot be used in the same transaction.
ALTER TYPE public.badge_criteria_type ADD VALUE IF NOT EXISTS 'course_completed';
