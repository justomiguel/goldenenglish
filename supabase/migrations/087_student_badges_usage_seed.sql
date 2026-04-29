-- Seeds platform-usage badges that rely on the criteria_type and category values
-- added in 086_student_badges_extra_criteria_types.sql.
-- Uses the same idempotent pattern as 082/085: ON CONFLICT (code) DO NOTHING.
-- All thresholds satisfy badge_catalog_threshold_nonneg.
-- Sort order layout (sort_order):
--   tasks         10–39   attendance_streak 38–43
--   attendance    44–49   profile           50–58
--   learning      60–69   community         70–79

WITH inserted AS (
  INSERT INTO public.badge_catalog (code, category, criteria_type, criteria_threshold, sort_order)
  VALUES
    -- Profile signals (one-shot). Sit alongside profile_complete (sort 50).
    ('profile_avatar_set',     'profile',    'profile_avatar_set',     1,  51),
    ('profile_phone_set',      'profile',    'profile_phone_set',      1,  52),
    ('profile_birth_date_set', 'profile',    'profile_birth_date_set', 1,  53),

    -- Attendance days (lifetime, distinct calendar days with good attendance).
    ('attendance_days_first',  'attendance', 'attendance_days_total',   1,  44),
    ('attendance_days_10',     'attendance', 'attendance_days_total',  10,  45),
    ('attendance_days_25',     'attendance', 'attendance_days_total',  25,  46),
    ('attendance_days_50',     'attendance', 'attendance_days_total',  50,  47),
    ('attendance_days_100',    'attendance', 'attendance_days_total', 100,  48),

    -- Messages sent from the portal (community/engagement category).
    ('messages_sent_first',    'community',  'messages_sent',           1,  70),
    ('messages_sent_10',       'community',  'messages_sent',          10,  71),
    ('messages_sent_25',       'community',  'messages_sent',          25,  72)
  ON CONFLICT (code) DO NOTHING
  RETURNING id, code
)
INSERT INTO public.badge_translations (badge_id, locale, title, description)
SELECT i.id, t.locale, t.title, t.description
FROM inserted i
JOIN (
  VALUES
    ('profile_avatar_set', 'en', 'Profile photo',
       'Upload a profile picture so your teachers and classmates can recognize you.'),
    ('profile_avatar_set', 'es', 'Foto de perfil',
       'Sube una foto de perfil para que tus profesores y compañeros te reconozcan.'),

    ('profile_phone_set', 'en', 'Reachable',
       'Add a phone number to your profile so the school can reach you when needed.'),
    ('profile_phone_set', 'es', 'Disponible',
       'Agrega un número de teléfono a tu perfil para que el instituto te pueda contactar.'),

    ('profile_birth_date_set', 'en', 'Birthday on file',
       'Tell us your date of birth so we can wish you happy birthday.'),
    ('profile_birth_date_set', 'es', 'Cumpleaños registrado',
       'Cuéntanos tu fecha de nacimiento así podemos felicitarte el día indicado.'),

    ('attendance_days_first', 'en', 'First class attended',
       'You showed up to your first class. Welcome on board.'),
    ('attendance_days_first', 'es', 'Primera clase asistida',
       'Asististe a tu primera clase. Bienvenido a bordo.'),

    ('attendance_days_10', 'en', 'Ten classes',
       'Attend ten classes in total (any combination of days).'),
    ('attendance_days_10', 'es', 'Diez clases',
       'Asiste a diez clases en total (cualquier combinación de días).'),

    ('attendance_days_25', 'en', 'Twenty-five classes',
       'Attend twenty-five classes in total. You are getting into a rhythm.'),
    ('attendance_days_25', 'es', 'Veinticinco clases',
       'Asiste a veinticinco clases en total. Ya tienes ritmo.'),

    ('attendance_days_50', 'en', 'Fifty classes',
       'Attend fifty classes in total. Real commitment.'),
    ('attendance_days_50', 'es', 'Cincuenta clases',
       'Asiste a cincuenta clases en total. Compromiso de verdad.'),

    ('attendance_days_100', 'en', 'Centurion attendance',
       'Attend one hundred classes in total. You are a fixture in your cohort.'),
    ('attendance_days_100', 'es', 'Centurión de asistencia',
       'Asiste a cien clases en total. Ya eres parte fija de tu comisión.'),

    ('messages_sent_first', 'en', 'First message',
       'Send your first message to a teacher or classmate from the portal inbox.'),
    ('messages_sent_first', 'es', 'Primer mensaje',
       'Envía tu primer mensaje a un docente o compañero desde la bandeja del portal.'),

    ('messages_sent_10', 'en', 'Active communicator',
       'Send ten messages from the portal. Communication unlocks learning.'),
    ('messages_sent_10', 'es', 'Comunicador activo',
       'Envía diez mensajes desde el portal. La comunicación impulsa el aprendizaje.'),

    ('messages_sent_25', 'en', 'Conversational',
       'Send twenty-five messages from the portal. You are a great teammate.'),
    ('messages_sent_25', 'es', 'Conversador',
       'Envía veinticinco mensajes desde el portal. Eres un gran compañero de equipo.')
) AS t(code, locale, title, description) ON t.code = i.code;
