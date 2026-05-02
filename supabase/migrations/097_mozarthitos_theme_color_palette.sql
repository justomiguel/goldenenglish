-- Paleta Mozarthitos alineada a `src/styles/mozarthitosLanding.css` (--mz-*).
-- Sin esto, `site_themes.properties` no redefine color.* y queda la paleta Golden de system.properties.

UPDATE public.site_themes
SET
  properties =
    coalesce(properties, '{}'::jsonb)
    || jsonb_build_object(
      'color.primary', '#c41e3a',
      'color.primary.light', '#ff455d',
      'color.primary.dark', '#9b1428',
      'color.primary.foreground', '#FFFFFF',
      'color.secondary', '#1096f0',
      'color.secondary.light', '#37a4ff',
      'color.secondary.dark', '#0c7cbd',
      'color.secondary.foreground', '#FFFFFF',
      'color.accent', '#f3c94e',
      'color.accent.foreground', '#1a0a0d',
      'color.background', '#FFFBF8',
      'color.surface', '#FFFFFF',
      'color.foreground', '#545454',
      'color.muted', '#FFF5F0',
      'color.muted.foreground', '#6B7280',
      'color.border', '#F0E4DE',
      'color.success', '#16A34A',
      'color.warning', '#EAB308',
      'color.error', '#DC2626',
      'color.info', '#1096f0',
      'color.calendarSpecial.holiday', '#374151',
      'color.calendarSpecial.institutionalExam', '#9b1428',
      'color.calendarSpecial.parentMeeting', '#6D28D9',
      'color.calendarSpecial.social', '#166534',
      'color.calendarSpecial.trimesterAdmin', '#1096f0',
      'shadow.soft', '0 4px 24px -4px rgb(196 30 58 / 11%)',
      'shadow.card', '0 12px 40px -12px rgb(16 150 240 / 16%)'
    ),
  updated_at = now()
WHERE slug = 'mozarthitos';
