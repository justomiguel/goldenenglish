# Mobile stat cards

**Intent:** On a narrow screen, colored stat cards sit in a compact grid. They fit the viewport width. They do not scroll sideways.

**Done when:** Messages folder counts and the finance KPI strip use a two-column grid below `sm`. Each tile drops the fixed minimum width that forced a horizontal scroller. `AdminStatCard` stays compact on a phone: smaller type, and the hint line stays hidden until `sm`. People, registrations, and events keep their existing grid and pick up the smaller card. Tests lock the grid classes and the absence of `overflow-x-auto` on those strips.

**Out of scope:** Removing the numbers, desktop layout above `sm`, and table horizontal scroll.
