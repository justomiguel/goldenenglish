-- Task review status. New enum values cannot be used in the same transaction.
ALTER TYPE public.task_progress_status ADD VALUE IF NOT EXISTS 'RETURNED';
