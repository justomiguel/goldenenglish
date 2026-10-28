# Institute answer pages (GEO / AEO)

**Intent:** Each public institute site gets one quiet page that answers the questions families already ask. The page is indexable and marked as `FAQPage` so Google and answer engines can quote it.

**Done when:**

- `/{locale}/preguntas` renders on Golden English, Mozarthitos, Espacio Zenit, Capoeira Nagô, Mi Mundo, and Liora Studio.
- The page uses the same public shell as privacy (tenant header and footer).
- A footer link sits next to the privacy link. The main nav does not add a new item.
- Copy is in `en.json`, `es.json`, and `pt.json`. Spanish uses neutral tuteo.
- The page emits `FAQPage` JSON-LD built from the same questions.
- `sitemap.xml` lists the page. `robots` stays indexable.
- Pulsar / Centro Listo returns 404 for this route.
- Answers use only facts already published on the landing. Prices, hours, and street addresses that are placeholders stay out.
- Vitest covers the question set per template, the JSON-LD shape, and the sitemap entry.

**Out of scope:** Google Business Profile, `llms.txt`, a CMS editor for the questions, prices, and new claims taken from third-party directories.

## Surfaces (Web vs PWA)

Public marketing page. Tier A audience, same pattern as `/privacidad`.

- **Web:** `PublicExperienceShell` plus the tenant register header already used by `PublicPrivacySurfaceByTemplate`. One article, max width about `3xl`.
- **PWA / narrow:** the same article. `PublicExperienceChrome` already switches the public frame. Do not add a second PWA tree. Touch targets on the footer link stay at least 44px where that footer is a button row (`LandingFooterPwa`).
- Shared footer links must keep the PWA footer working. Add the link in every footer that already links to `/privacidad`.

## Route

- Path: `/{locale}/preguntas` for `es`, `en`, and `pt` (same segment as `/privacidad`).
- Metadata: title and description from the dictionary for the active template.
- `robots: { index: true, follow: true }`.
- If `isPulsarPlatformRequest()` is true, `notFound()`.
- If the site still needs initial setup, redirect home, same as privacy.

## Research (2026-10-28)

The first question list came from landing copy and a few press notes. It did not come from Google review text.

A second pass searched Google review snippets, map listings, and the questions parents ask in each niche (English school, baby music, kids dance, capoeira, jardín maternal, ballet).

Public Google review text for these six places is missing or not indexed:

- Golden English in Riacho He Hé: no review text. Other schools named Golden English (Mexico, Indonesia) are different businesses.
- Mozarthitos: no Google review text. Press (Katalogo, 2023) says sessions are weekly, parents stay, and ages run to 8. The landing does not say that.
- Espacio Zenit: no Google review text. Event listings put Hip Hop Kids in Providencia and Ñuñoa. The landing does not name those communes.
- Capoeira Nagô: no Google review text. Old posts invite all ages in Ñuñoa and ask people to comment so the school can reply.
- Mi Mundo: the Avalos 555 listing asks to be the first reviewer. A French 535 listing has two ratings and no written reviews. Neighboring jardines in Resistencia get comments about age, afternoon shift, and whether staff report if a child is unwell.
- Liora Studio: no public reviews.

Niche questions people actually ask, and whether this product can answer them today:

| Niche question | Can the page answer it now? |
|---|---|
| Age, place, what they teach, trial class, certificate name | Yes, from the landing |
| Price, uniform, class size ratio, food, adaptation, absence policy | No. Do not invent |
| Mozarthitos: does the adult stay in class? Until what age? | Only if the institute confirms the 2023 press lines |
| Espacio Zenit: which commune and which weekdays? | Only if the institute confirms the event listings |
| Capoeira: is it full contact? | Do not claim. The landing does not say |
| Jardín: afternoon shift, ratios, who may pick up the child | Do not claim |

The page answers the niche question only when the landing already states the fact. Unanswered questions stay off the page.

## Content rules

- Six to ten questions per institute. Extra People Also Ask items live in the 2026-10-28 PAA spec.
- The first sentence of each answer states the fact. Later sentences add only published detail.
- Institute name, phone, email, and address come from `BrandPublic` when the answer is "where" or "how to write". Do not copy brand nouns into the dictionaries.
- Do not publish Espacio Zenit placeholder phone, email, or "Centro urbano".
- Do not use the French 535 listing for Mi Mundo. The product address is Av. Avalos 555.
- Do not add "until 8 years" or "parents stay in class" for Mozarthitos. Those lines are in press, not in the landing copy.
- Do not pin a street for Capoeira Nagô. The landing says Santiago and regions, not one room.

## Questions (Spanish source)

English and Portuguese are translations of these answers. Keep the same facts.

### Golden English (`classic`, `editorial`, `minimal`)

1. ¿Qué es Golden English? Instituto de inglés en Riacho He Hé, Formosa, desde 2005. La enseñanza es práctica y usa situaciones reales.
2. ¿Desde qué edad se puede estudiar? Niños desde los 5 años, adolescentes desde los 11 y adultos.
3. ¿Hay clases presenciales y a distancia? Sí. La sede es presencial en Riacho He Hé. La modalidad remota es en vivo, no grabada, con los mismos objetivos. En general son dos clases de 60 minutos por semana.
4. ¿Qué niveles tienen? El recorrido sigue el MCER, de A1 a C2.
5. ¿Qué certificación se puede rendir? Preparan el B2 First de Cambridge. También hay certificación nacional por el convenio con la UTN. El instituto está inscripto con la resolución ministerial 1297/05 de Formosa.
6. ¿Cómo me inscribo? Desde la página de inscripción del sitio, o por el teléfono y el correo publicados en el contacto.

### Mozarthitos

1. ¿Qué es Mozarthitos? Academia de música para la infancia en Las Condes. La fundaron en 2022 Felipe Andreani y Jane Guerra.
2. ¿Qué método usan? El método Mago Diapasón, creado por Paqui Castro. El cuento es «Viajando al país de la música».
3. ¿Desde qué edad? Desde los 6 meses. Las sesiones duran 30 minutos. Desde los 3 años los niños empiezan a seguir partituras.
4. ¿Dónde quedan las clases presenciales? Sede Las Condes, República Árabe de Egipto 670.
5. ¿Hay modalidad online? El sitio ofrece la modalidad online desde la sección de cursos.
6. ¿Cómo reservo un lugar? Por el teléfono y el correo del contacto, o por la inscripción del sitio.

### Espacio Zenit

1. ¿Qué es Espacio Zenit? Escuela de danza. Junta hip-hop y ballet clásico, con un ambiente pensado para las familias.
2. ¿Qué disciplinas hay? Ballet clásico (alineación, repertorio y presencia) e Hip Hop for Kids (ritmo, freestyle y coreografía).
3. ¿Cómo se arman los grupos? Grupos semanales por edad y nivel. La landing no publica una edad mínima fija. La familia consulta el grupo que corresponde.
4. ¿Las inscripciones están abiertas? Sí. El sitio dice que las inscripciones están abiertas todo el año y que se puede reservar una clase.
5. ¿Dónde escribo? Por el formulario de contacto y por Instagram. No publiques una calle ni un teléfono de relleno.

### Capoeira Nagô

1. ¿Qué es Capoeira Nagô? Escuela de capoeira. Usa la capoeira para el desarrollo físico, personal, cultural y social. Raíces brasileñas e historia en Chile.
2. ¿Necesito experiencia? No. El sitio dice que no necesitas experiencia previa.
3. ¿Qué edades entrenan? Niños de 4 a 12 años, jóvenes de 13 a 17, adultos desde los 18 y adultos mayores desde los 55.
4. ¿Quién dirige? Mestre Fagulha. Formación brasileña y más de 20 años de capoeira en Chile, en Santiago y en regiones.
5. ¿Qué se entrena? Deporte, movimiento, disciplina, música, cultura y desarrollo personal.
6. ¿Hay actividades además de la clase? Campeonatos, rodas, workshops e intercambios. El calendario vive en la sección de eventos.
7. ¿Cómo agendo una clase? Con el botón de agenda o de clase de prueba del sitio, o por el contacto publicado.

### Mi Mundo

1. ¿Qué es Mi Mundo? Jardín materno infantil en Resistencia, Chaco.
2. ¿Qué edades reciben? Desde los 45 días hasta los 5 años.
3. ¿Cuál es la propuesta? Inspirada en Reggio Emilia y Pikler. Arte, naturaleza, música, iniciación a la lectura y movimiento libre.
4. ¿Dónde queda? Av. Avalos 555, Resistencia, Chaco. Teléfono y correo salen de la marca.
5. ¿Hay colonia de vacaciones? Sí, en vacaciones escolares, para infancias de 3 a 12 años. Jornada completa o media jornada. Fechas y aranceles se publican cada temporada.
6. ¿Cómo reservo un cupo? Con el botón de reserva del sitio o por el contacto del jardín.

### Liora Studio

1. ¿Qué es Liora Studio? Escuela de ballet en Santiago, para quien empieza y para quien vuelve a bailar.
2. ¿Qué edades hay? Pre Ballet de 3 a 5 años, Ballet Infantil de 6 a 9, Ballet Juvenil de 10 a 14 y Ballet Adulto desde los 15.
3. ¿Dónde están las sedes? Providencia (Metro Parque Bustamante), Maipú (Metro Plaza Maipú) y San Miguel (Metro San Miguel).
4. ¿Qué día hay clase? Los horarios publicados son los sábados. Otro día se consulta por escrito.
5. ¿Cómo es la clase? Grupos con cupo acotado, corrección individual y muestras anuales sin presión competitiva.
6. ¿Cómo pido una clase de prueba? Con el formulario de clase de prueba. El equipo confirma sede, horario y nivel.

## Implementation

- Pure list: `src/lib/public/instituteAnswerPages.ts`. Input is `templateKind`. Output is stable question ids. Visible strings stay in the dictionaries.
- Page: `src/app/[locale]/preguntas/page.tsx`. Thin server page, same data load as privacy.
- UI: `PublicAnswerSurfaceByTemplate` next to the privacy surface. One article component. Reuse tenant font roots and register headers. Do not fork six page files.
- JSON-LD: `JsonLdFaqPage` molecule. `FAQPage` with `Question` / `acceptedAnswer`.
- Footer link key: `publicAnswers.footerLink` ("Preguntas" / "Questions" / "Perguntas").
- Sitemap: add `/preguntas` to `INDEXED_PATHS` on institute hosts.
- Home `<title>`: `buildHomePageMetadata(brand.name, taglineForLocale(brand, locale))` emits `Brand — Tagline` (no pipe) when a tagline exists.
- Public page canonicals: `/preguntas`, `/privacidad`, and `/contact` set their own `alternates.canonical` and `alternates.languages` so they do not inherit `/{locale}` from the locale layout.
- Organization JSON-LD: `JsonLdOrganization` filters out placeholder phone, email, and address values with `isPublishablePublicContact`.
- Open Graph locale: `openGraphLocaleForInstitute(templateKind, pageLocale)` emits `es_CL` for Chile tenants, `es_AR` for Golden and Mi Mundo, `en_US` / `pt_CL` or `pt_AR` for other locales.
- Department JSON-LD: Liora adds three `department` places (Providencia, Maipú, San Miguel) from published metro copy. Other institutes keep one `address`.
- Tests: question ids per kind, no placeholder phone in Espacio Zenit answers, JSON-LD type, sitemap URL, home title with tagline, Organization JSON-LD placeholder filter, Open Graph locale, and Liora departments.

## Risks

- A wrong address (Mi Mundo French 535, Espacio Zenit placeholders) would teach answer engines a false fact. The copy gate above blocks that.
- Footer edits can break a tenant chrome test. Update those tests in the same change.
