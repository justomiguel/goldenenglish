# Nagô landing — replace AI photos with gallery photos

**Intent:** Point the remaining AI landing photos at real files already in the event galleries.
**Done when:** Hero, programs, experience, events, and the closing photo load gallery jpgs. Mestre and Nagô en acción stay as they are.
**Out of scope:** Copy, the Mestre file, `nago-accion-01.jpg` through `nago-accion-04.jpg`, and the gallery section itself.

## Surfaces (Web vs PWA)

Tier A public landing. The organisms are shared. No separate PWA tree. The same URLs serve `web-desktop`, `web-mobile`, and `pwa-mobile`. Frames stay as they are (`object-cover`).

## Choice

Source folders: `conexion-internacional-2025` and `capoeira-me-chama-2022`. Each slot is a different file. The crop is the frame that already exists.

| Slot | File | Why |
|---|---|---|
| Hero 1 | conexion `38.jpg` | Full group in the academy. Faces sit in the upper half. |
| Hero 2 | conexion `15.jpg` | Bateria and berimbau under the banner. |
| Hero 3 | conexion `01.jpg` | Children on stage with the Nagô banner. |
| Hero 4 | me-chama `11.jpg` | Children in an outdoor circle. |
| Niños | conexion `02.jpg` | Four children, already 3:4. |
| Jóvenes | conexion `09.jpg` | Older girls in the circle. No photo is only ages 13–17. |
| Adultos | conexion `07.jpg` | Adult jogo. |
| Adultos mayores | conexion `40.jpg` | Street music. An older adult is in front. No photo is only +55. |
| Experience main | me-chama `10.jpg` | A small child inside the roda. |
| Experience music | conexion `12.jpg` | Atabaque and berimbau, already 4:3. |
| Experience movement | me-chama `19.jpg` | A line of aú. |
| Experience children | conexion `13.jpg` | Children walking with the bateria behind them. |
| Experience culture | me-chama `14.jpg` | Outdoor class and the banner. |
| Winter Open | conexion `24.jpg` | The group on stage. |
| Roda especial | me-chama `05.jpg` | Indoor roda with berimbau. |
| Intercambio Brasil | me-chama `20.jpg` | Outdoor roda, public, and the banner. |
| Convert | conexion `08.jpg` | The whole group at sunset. |

## Risks

`object-cover` still crops. The picks put the subject near the center, or near 42% for the hero. A browser may cache an old template URL. The new URLs are different paths.
