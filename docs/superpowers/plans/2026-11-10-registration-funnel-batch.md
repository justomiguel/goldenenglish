# Registration funnel width and chosen batch

Spec: `docs/superpowers/specs/2026-11-10-registration-funnel-batch-design.md`

1. Give each arrow its own fill and make the row `w-full`.
2. Add page selection (row checkbox, header checkbox, Seleccionar todos / Quitar selección). Clear it when the page or the stage changes.
3. Add a batch action for the marked ids. Inscriptos calls `markRegistrationContacted`. Later stages call `revertRegistrationFunnelStageAction`.
4. Confirm before the action. Show `funnel_batch_empty`, `funnel_batch_partial`, `forbidden`, and `save_failed` with their own sentences.
5. Cover Web and the narrow list with the same toolbar and the same selection state.
