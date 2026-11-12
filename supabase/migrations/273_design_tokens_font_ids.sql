-- Map stored font family names to catalog ids.
-- Sets font.heading from font.secondary and font.body from font.primary
-- only when the new key is absent and the family is in the open catalog.
-- A second run changes 0 rows.

with families(name, id) as (
  values
    ('dm sans', 'dm-sans'),
    ('fraunces', 'fraunces'),
    ('oswald', 'oswald'),
    ('outfit', 'outfit'),
    ('cormorant garamond', 'cormorant-garamond'),
    ('jost', 'jost'),
    ('nunito', 'nunito'),
    ('caveat', 'caveat'),
    ('baloo 2', 'baloo-2'),
    ('bebas neue', 'bebas-neue'),
    ('pacifico', 'pacifico'),
    ('plus jakarta sans', 'plus-jakarta-sans'),
    ('jetbrains mono', 'jetbrains-mono'),
    ('playfair display', 'playfair-display'),
    ('allura', 'allura')
)
update public.site_themes as theme
set properties = theme.properties || jsonb_strip_nulls(jsonb_build_object(
  'font.heading',
  case
    when coalesce(theme.properties->>'font.heading', '') <> '' then null
    else (
      select families.id
      from families
      where families.name = lower(theme.properties->>'font.secondary')
    )
  end,
  'font.body',
  case
    when coalesce(theme.properties->>'font.body', '') <> '' then null
    else (
      select families.id
      from families
      where families.name = lower(theme.properties->>'font.primary')
    )
  end
))
where (
  coalesce(theme.properties->>'font.heading', '') = ''
  and exists (
    select 1
    from families
    where families.name = lower(theme.properties->>'font.secondary')
  )
) or (
  coalesce(theme.properties->>'font.body', '') = ''
  and exists (
    select 1
    from families
    where families.name = lower(theme.properties->>'font.primary')
  )
);
