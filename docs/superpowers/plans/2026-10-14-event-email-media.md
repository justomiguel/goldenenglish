# Email images and video links

1. Pure HTML builders: https image tag, YouTube thumbnail link, Vimeo text link. Reject anything else.
2. Sanitizer keeps that HTML and still drops iframe and data URLs.
3. Upload PNG/JPEG/WebP (max 4 MB) through the existing public `event-media` bucket and insert the image.
4. Toolbar buttons on the shared email editor, with progress and dictionary copy.
