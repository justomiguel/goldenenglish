# Images and video links in event email templates

**Intent:** Let staff insert a hosted image or a video link in the same WYSIWYG used for event mails and institute email templates. The saved HTML must still pass the email sanitizer, and the picture or link must survive in a real inbox.

**Done when:**

- The toolbar has an image button and a video button, with dictionary labels in es, en, and pt, and a leading Lucide icon.
- Image: staff pick PNG, JPEG, or WebP. The file uploads to public storage and the editor inserts `<img src="https://…" alt="…">`. A data URL is not stored. Upload progress uses `InlineUploadProgressBar`.
- Video: staff paste a YouTube or Vimeo URL. The editor inserts a link to that URL (a thumbnail image linking out when the host provides one). It does not insert `<iframe>`, `<video>`, or `<embed>`.
- Saving still runs `sanitizeEmailTemplateHtml`. `https` images and links remain. Script, iframe, and `javascript:` / `data:` URLs are still removed.
- Preview in the event mail editor shows the image and the video link.
- Tests cover insert, sanitizer allow/deny, and that a video URL does not become an iframe.

**Out of scope:**

- Playing a video inside the email body.
- Arbitrary file hosts other than YouTube and Vimeo.
- A second editor only for events. The buttons live on the shared `EmailTemplateTiptapBody`, so institute templates get the same tools.
