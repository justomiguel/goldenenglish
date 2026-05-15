/**
 * Cache tag invalidated when an admin re-runs the site setup wizard or
 * otherwise changes operational defaults stored in `site_settings`. Every
 * loader in `src/lib/<contexto>/load*.ts` that reads one of those rows should
 * be wrapped in `React.cache` and revalidated via this tag through
 * `updateTag()` after the wizard server action persists changes.
 */
export const SITE_SETTINGS_OPERATIONAL_CACHE_TAG = "site-settings-operational";
