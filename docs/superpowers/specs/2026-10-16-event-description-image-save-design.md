# Save event description images when other locales are empty

**Intent:** Saving an event description must persist its images even when English or Portuguese titles are still empty. The image must show on the public event page.

**Done when:**

- A save that includes the default locale title and a description with an image succeeds when the other locales have an empty title.
- Those empty-title locales are not written as translation rows and do not reject the save.
- If an empty-title locale holds an image that the default description does not, that image is copied onto the default description before save.
- The default description, including the image, is stored on the event and on its default-locale translation.
- The public event list and the public event page are revalidated so the image can show (the first image remains the cover).
- A save with an empty default-locale title still fails.

**Out of scope:** Changing cover behavior (first image stays the hero). Schedule and price forms. How images are uploaded.
