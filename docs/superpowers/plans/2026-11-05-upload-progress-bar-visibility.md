# Upload progress bar visibility

Spec: `docs/superpowers/specs/2026-11-05-upload-progress-bar-visibility-design.md`

## Steps

1. Update `48-file-upload-progress.mdc`: the bar mounts only while a file is read or sent, and unmounts when that phase ends.
2. For each control in the spec list, render `InlineUploadProgressBar` only in the active phase. Idle `value={0}` goes away.
3. Update tests that expect an idle bar. Add a check that the idle control has no `progressbar` where a test file already mounts that control.
4. Run the touched Vitest files.
