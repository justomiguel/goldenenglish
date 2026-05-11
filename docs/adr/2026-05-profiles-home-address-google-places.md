# ADR: Perfil — domicilio con Google Places

## Contexto

Staff y usuarios autenticados necesitan registrar una **dirección de domicilio** visible en el resumen del perfil. Se pidió **autocompletado** alineado con **Google Maps** para reducir errores de captura y permitir abrir la ubicación en Maps.

## Decisión

1. **Modelo:** columnas nuevas en `public.profiles`: `home_address_text` (texto legible, nullable) y `home_place_id` (Google Place ID cuando la dirección se eligió del autocompletado; nullable si se escribió a mano). Migración `111_profiles_home_address.sql`.

2. **Menores con tutor:** el trigger `profiles_block_minor_self_sensitive_update` también bloquea cambios autónomos de domicilio (igual que nombre, teléfono, etc.); admin o tutor siguen pudiendo actualizar según RLS existente.

3. **Cliente:** widget **`PlaceAutocompleteElement`** (Places library nueva) con `includedPrimaryTypes` orientados a domicilio (`street_address`, `premise`, `subpremise`), equivalentes prácticos al antiguo `types: ["address"]`. Tras seleccionar una sugerencia se llama `fetchFields` con `formattedAddress` e `id`. Carga del JS API con `loading=async` e `importLibrary("places")`. En GCP debe estar habilitada **Places API (New)** para cuentas/reglas nuevas.

4. **Clave pública:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` documentada en `.env.example`. Debe crearse en Google Cloud con **referrer HTTP** acotado a los orígenes del tenant y APIs habilitadas **Maps JavaScript API**, **Places API (New)** (autocomplete/widget) y **Geocoding API** (vista previa con marcador).

5. **Sin clave:** el mismo campo sigue disponible como **texto libre** (textarea o input), sin sugerencias.

6. **Admin:** server action dedicada `updateAdminUserDetailHomeAddressAction` (normalización en servidor + auditoría `admin_user_detail_update_home_address` + sincronía opcional de `user_metadata` para onboarding). Opción **`applyToFamily`**: recalcula el grupo conexo en `tutor_student_rel` en servidor y puede persistir el mismo domicilio en todos los perfiles del hogar.

7. **Usuario (Mi perfil):** mismo modelo persistido vía `updateMyProfile` con `normalizeHomeAddressInput`.

8. **Vista previa en mapa:** el cliente usa **`google.maps.Geocoder`** (requiere **Geocoding API** en la misma clave) para mostrar un marcador a partir del texto o del `place_id`, incluyendo dirección escrita a mano cuando el geocoder la resuelve. El pin usa **`google.maps.marker.AdvancedMarkerElement`** (no `google.maps.Marker`): el `Map` lleva **`mapId`** (`NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`, con fallback documentado a `DEMO_MAP_ID` solo para pruebas). Los IDs devueltos por la Place class pueden usar prefijo `places/`; antes de persistir o pasarlos al geocoder legado se normaliza con `normalizeGooglePlaceIdForStorage`.

## Opciones descartadas

- **Solo texto sin BD nueva:** no cumple persistencia ni listados futuros.
- **Geocode servidor solo:** más latencia/coste por pulsación y no replica UX de autocomplete estándar; se puede añadir después si hace falta lat/long dedicados.
- **Confiar en lista de ids enviada por el cliente para “toda la familia”:** descartado; el servidor siempre recalcula el cluster con `loadTutorStudentFamilyClusterIds`.

## Consecuencias

- Coste y cumplimiento: uso de Google según proyecto Cloud; revisar cuotas y restricciones de clave (JS + Places API New + Geocoding); crear **Map ID** para marcadores avanzados en producción (evitar depender solo de `DEMO_MAP_ID`).
- Tests en `normalizeHomeAddressInput`, URLs de Maps y actions admin cubren contratos principales.
- El widget legacy `google.maps.places.Autocomplete` ya no se usa en código nuevo; seguir la guía oficial si Google amplía el sunset.
