-- Adds extra seed badges to the catalog created in 082_student_badges_catalog.sql.
-- Uses ONLY criteria_type values supported by the evaluator
-- (`evaluateBadgeCatalogEligibility.ts`): tasks_completed, attendance_streak,
-- assessments_passed. `profile_complete` already has the single one-shot row.
-- Idempotent: ON CONFLICT (code) DO NOTHING + translations only inserted when
-- the catalog row was actually created in this run.

WITH inserted AS (
  INSERT INTO public.badge_catalog (code, category, criteria_type, criteria_threshold, sort_order)
  VALUES
    -- Tasks: scale beyond 10 to keep mid- and long-term motivation.
    ('tasks_completed_25',        'tasks',      'tasks_completed',     25,  35),
    ('tasks_completed_50',        'tasks',      'tasks_completed',     50,  37),
    ('tasks_completed_100',       'tasks',      'tasks_completed',    100,  39),
    -- Attendance: warm-up (3 days), then longer streaks for stickiness.
    ('attendance_streak_3',       'attendance', 'attendance_streak',    3,  38),
    ('attendance_streak_10',      'attendance', 'attendance_streak',   10,  41),
    ('attendance_streak_20',      'attendance', 'attendance_streak',   20,  42),
    ('attendance_streak_30',      'attendance', 'attendance_streak',   30,  43),
    -- Assessments: build on first_assessment_passed (sort 60) with milestones.
    ('assessments_passed_5',      'learning',   'assessments_passed',   5,  61),
    ('assessments_passed_10',     'learning',   'assessments_passed',  10,  62),
    ('assessments_passed_25',     'learning',   'assessments_passed',  25,  63)
  ON CONFLICT (code) DO NOTHING
  RETURNING id, code
)
INSERT INTO public.badge_translations (badge_id, locale, title, description)
SELECT i.id, t.locale, t.title, t.description
FROM inserted i
JOIN (
  VALUES
    ('tasks_completed_25', 'en', 'Twenty-five tasks',
       'Complete twenty-five learning tasks in total.'),
    ('tasks_completed_25', 'es', 'Veinticinco tareas',
       'Completa veinticinco tareas de aprendizaje en total.'),

    ('tasks_completed_50', 'en', 'Half a hundred',
       'Complete fifty learning tasks in total.'),
    ('tasks_completed_50', 'es', 'Medio centenar',
       'Completa cincuenta tareas de aprendizaje en total.'),

    ('tasks_completed_100', 'en', 'Centurion',
       'Complete one hundred learning tasks. You are unstoppable.'),
    ('tasks_completed_100', 'es', 'Centurión',
       'Completa cien tareas de aprendizaje. Eres imparable.'),

    ('attendance_streak_3', 'en', 'Three-day streak',
       'Attend class for three consecutive calendar days (present, late, or excused).'),
    ('attendance_streak_3', 'es', 'Racha de 3 días',
       'Asiste a clase tres días corridos (presente, tarde o justificado).'),

    ('attendance_streak_10', 'en', 'Ten-day streak',
       'Attend class for ten consecutive calendar days. Habits are forming.'),
    ('attendance_streak_10', 'es', 'Racha de 10 días',
       'Asiste a clase diez días corridos. Estás formando hábito.'),

    ('attendance_streak_20', 'en', 'Twenty-day streak',
       'Attend class for twenty consecutive calendar days. Discipline unlocked.'),
    ('attendance_streak_20', 'es', 'Racha de 20 días',
       'Asiste a clase veinte días corridos. Disciplina desbloqueada.'),

    ('attendance_streak_30', 'en', 'Monthly marathon',
       'Attend class for thirty consecutive calendar days without breaking the streak.'),
    ('attendance_streak_30', 'es', 'Maratón mensual',
       'Asiste a clase treinta días corridos sin cortar la racha.'),

    ('assessments_passed_5', 'en', 'Five tests passed',
       'Pass five assessed mini-tests from your classes.'),
    ('assessments_passed_5', 'es', 'Cinco tests aprobados',
       'Aprueba cinco mini-tests evaluados de tus clases.'),

    ('assessments_passed_10', 'en', 'Ten tests passed',
       'Pass ten assessed mini-tests. You are mastering the material.'),
    ('assessments_passed_10', 'es', 'Diez tests aprobados',
       'Aprueba diez mini-tests evaluados. Estás dominando el contenido.'),

    ('assessments_passed_25', 'en', 'Assessment expert',
       'Pass twenty-five assessed mini-tests across your courses. Pure consistency.'),
    ('assessments_passed_25', 'es', 'Experto en evaluaciones',
       'Aprueba veinticinco mini-tests evaluados en tus cursos. Consistencia pura.')
) AS t(code, locale, title, description) ON t.code = i.code;
