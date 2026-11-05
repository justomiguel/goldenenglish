# Upload progress bar visibility

**Intent:** Show `InlineUploadProgressBar` only while a file is being read or sent. Remove the bar when that work ends.

**Done when:**

- An idle file control has no progress bar.
- A bar appears when reading starts or sending starts.
- The bar is gone after success, error, or cancel. The error text stays.
- `.cursor/rules/48-file-upload-progress.mdc` matches this behavior.
- Tests cover hide-when-idle for each touched control.

**Out of scope:** Changing upload limits, copy, or the long-job modal (`LongJobActivityModal`). `BlockingFileUploadModal` stays a modal that opens only for an active upload.

## Surfaces (Web vs PWA)

Shared molecules own the bar. Institute admin screens are Tier B (desktop). Public registration, event register, profile photo, and CentroListo profile are Tier A and already share these molecules on Web and PWA. No separate PWA bar tree exists. The same show/hide rule applies on both surfaces.

## Behavior

Mount the bar only when the local phase is reading or sending.

- Reading: determinate `value` from the file reader.
- Sending without byte progress: `indeterminate`.
- Signed URL or XHR: determinate percent.

Do not render `value={0}` while the control is idle.

These controls already hide the bar when idle. Leave that pattern:

- `EventRegisterFormFooter`
- `ImportStudents`
- `GenericSiteLogo`
- `BlockingFileUploadModal`

These controls keep the bar mounted at rest. Gate the bar on the active phase:

- `PulsarProfileForm`
- `AdminMerchPhotoField`
- `AdminUserAvatarUploadForm`
- `AcademicProfileValueRows`
- `EventRegisterTransferReceiptField`
- `AdminEventDiscountCodeEditor`
- `ImportUsers`
- `LandingMediaSlotEditor`
- `SiteThemeBrandAssetsPanel`
- `EventRegisterCustomFileField`
- `EventRegisterFormFields`
- `ProfileAvatarChangeFab`
- `SectionReferenceImageField`
- `ReceiptAutoUploadField`
- `EmailTemplateTiptapBody`
- `RegistrationMatriculaPayActions`
- `LearningTaskTemplateLibrary`
- `AdminBadgeImageEditor`
- `SiteSetupWizard`
- `AdminGlobalContentMaterialsPanel`

## Rule change

Update `48-file-upload-progress.mdc`. The bar is required during the upload. It is absent before the person picks a file and after the upload ends.
