# Table column sort toggle

## Intent

A click on a data column header sorts the table by that column. A second click on the same header reverses that sort. A custom academic field that is a Students column can be sorted this way, and it can still be filtered.

## Done when

- On Alumnos, Profes, Padres, and Usuarios, a header click replaces the sort with that one column, ascending. A second click on the same header flips ascending and descending. The click does not append a second criterion.
- The separate sort panel can still stack criteria. A later header click clears that stack and leaves one column.
- A custom academic column is sortable. The sort runs on the server before the page slice. Text, long text, email, and phone use a case-insensitive compare. Number and date use their typed value. A list value sorts as text. An empty value sorts last in both directions.
- File and image fields stay off the column list, so they have no sort.
- Client tables that already use `useClientTableSort`, the events list, the transfer inbox, and the collections matrix keep the same first-click / second-click rule.
- The actions column stays not sortable. The registrations intent column stays not sortable.

## Out of scope

- Drag order of custom fields.
- Sort by a custom field that is not marked as a column.
- A new sort control on the narrow Students list. That list already uses the same URL sort as the desktop table.

## Surfaces (Web vs PWA)

Tier B admin directories. Students already has a narrow list. Web and narrow share the URL sort (`order`, `sort`, `dir`). Both show the new order. No separate PWA sort widget.

Client tables on student and parent billing already toggle through `useClientTableSort`. This change does not replace those trees.

## Decision

Header click means one column. The sort panel means a stack. Custom-field sort keys use `acf:<field uuid>` inside the existing `order` param. An unknown or archived field id falls back to name ascending.

## Risks

- Header click used to add a criterion. Staff who stacked sorts from the header must use the sort panel.
- A custom-field sort must happen after the academic filter and before `slice`, or the page order is wrong.

## Definition of done

- Tests lock the header cycle, the custom-field compare, and the fallback for an unknown field id.
- Visible copy stays in the dictionaries. No new strings if the existing sort labels cover the toggle.
