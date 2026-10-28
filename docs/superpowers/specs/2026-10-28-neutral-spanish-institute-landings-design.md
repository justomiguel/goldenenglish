# Neutral Spanish on institute landings

**Intent:** Public Spanish on each institute site stays Latin American tuteo. Unaccented voseo CTAs must not remain.

**Done when:**

- Golden, Nagô, and Mi Mundo landing CTAs use *Inscríbete*, *Súmate*, and *Anótate*.
- Shared register/celebrate strings that said *Sumate* use *Súmate*.
- The neutral-Spanish test flags unaccented voseo (*inscribite*, *anotate*, *sumate*).
- Rule `40-neutral-spanish-copy.mdc` bans those forms for every tenant, not only landings.
- Published event copy in tenant DBs uses tuteo.

**Out of scope:** Repo-wide rewrite of old landing prose that is already tuteo. Chile/Argentina place names stay as published facts. Staff-only changelog lines that quote the old word *inscripto*.

## Surfaces (Web vs PWA)

Copy-only. Web and PWA read the same dictionary keys. No layout change.
