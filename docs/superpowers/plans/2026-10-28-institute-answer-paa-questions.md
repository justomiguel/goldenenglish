# Plan — PAA questions on `/preguntas`

1. Extend `EXPECTED_IDS` in `instituteAnswerPages.test.tsx`.
2. Add the new items to `es.json`, `en.json`, and `pt.json`.
3. Assert the new answers have no price and no uniform list.
4. Add a changelog row for the extra public answers.
5. Run `vitest run src/__tests__/lib/public/instituteAnswerPages.test.tsx src/__tests__/i18n/neutralSpanishCopy.test.ts`.
