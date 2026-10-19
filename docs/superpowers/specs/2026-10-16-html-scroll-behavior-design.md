# Keep smooth scrolling off route transitions

**Intent:** Next.js warns because the Nago landing sets `scroll-behavior: smooth` on `<html>`. Mark that element so in-page smooth scrolling stays and route changes do not use it.

**Done when:** The root `<html>` has `data-scroll-behavior="smooth"`.

**Out of scope:** Removing smooth scrolling from the Nago landing. Other tenants.
