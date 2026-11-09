# Admin page session redirect

1. Vitest for `requireAdminPage`: unauthorized redirect, forbidden redirect, other error rethrow, success return.
2. Add `src/lib/dashboard/requireAdminPage.ts`.
3. Call it from the three admin events pages after `locale` is known.
4. Run the new test file.
