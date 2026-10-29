# Mobile responsive layout — design

## Intent

Everyone (parents, teachers, admins) opens EduNest from phones very often. Today the app is desktop-only: the sidebar is permanent and takes half the screen, tables overflow, dialogs are cramped. The goal is that every screen is comfortable on a phone, not just technically reachable.

## Decisions (agreed with the user)

- Every role and every page must work on a phone.
- **All tables become card lists on phones**, not only the most used ones (the user explicitly asked for cards everywhere).
- No mockup review: the user trusts the builder's layout choices.
- No new dependencies; MUI 9 built-ins only (`useMediaQuery`, `theme.breakpoints`, `Drawer` variants, `sx` breakpoint values).

## Breakpoints (my call)

- **Phone** = below `sm` (< 600px): cards instead of tables, full-screen dialogs, single-column forms.
- **Narrow** = below `md` (< 900px, phones and portrait tablets): sidebar hidden behind a menu button.
- At `md` and above everything stays exactly as today. Desktop must not change visually.

## Shell

- `AdminLayout` + `Sidebar`: below `md` the sidebar becomes a temporary `Drawer` opened by a ☰ button in the header and closed on navigation or backdrop tap; the main area takes the full width (no `calc(100% - 240px)`). Same for `ParentLayout`/`RoleLayout` if they use the sidebar or a wide header.
- `Header`: compact below `md` (menu button, title/brand shortened, `InstitutionSwitcher` and profile menu kept; long names truncated with ellipsis).
- Page padding: smaller on phones (`p: { xs: 1.5, sm: 3 }` or similar).
- Page headers (title + action buttons): wrap; on phones actions go under the title, full width or icon buttons.

## Tables → cards

Every table in the app (about 43 files: lists, finance tables, payroll, audit, reports, register month grid, timetable, calendar, meals, settings directories, dialogs that contain tables) renders as a list of cards on phones:

- Card = one row: a title line (the row's main identity, e.g. child name, date, position name), the important fields as `label: value` lines, status as a chip, row actions as icon buttons at the card bottom/right. Expandable rows (e.g. payments with allocations) expand inside the card.
- Grids that are not row lists become cards per natural unit: register month grid → one card per child with the month's marks in a compact wrap; timetable week → one card per day; calendar → one card per entry; reports → one card per row with every column as `label: value`, totals as a final card.
- Empty states, loading and pagination keep working on phones.
- A shared building block lives in `shared/ui/` (e.g. a card-list component taking items and a render or field config, plus a `useIsPhone()` hook in `shared/lib/`); pages keep their table for `sm` and up and switch to cards below. The exact API is left to the builder, but every page must use the shared pieces rather than ad-hoc cards.

## Dialogs and forms

- All dialogs (≈72) are `fullScreen` on phones, with the title at the top and action buttons reachable at the bottom.
- Form fields stack in one column on phones; side-by-side `Box display: flex` rows wrap.
- Date/time inputs and selects stay native-friendly (no hover-only interactions).

## Touch

- Tap targets ≥ 40px for frequent actions: register marks (day register), lesson marking, meal ordering, absence notices.
- No hover-only information: tooltips that carry meaning (e.g. void reasons) must also be visible in the card (as a line) on phones.

## Parent cabinet

- Child tabs are scrollable (`variant="scrollable"`), all parent tabs (finance, attendance, lessons, meals, routine, schedule) have no horizontal page scroll and use cards.
- Payment and online-payment flows (`/pay/*` pages) fit a phone.

## Non-goals

- No separate mobile app, no PWA/offline work.
- No redesign of desktop.
- No backend changes.
- No change to theme colours/typography (the frontend CLAUDE.md forbids theme changes without a request); responsive behaviour goes into components, not `theme.ts`, except where a breakpoint value is needed from the theme object.

## Anti-goals

- A page that scrolls horizontally on a 360px-wide screen.
- Desktop layouts that change or regress.
- Different card styles on every page.

## Verification

- `npm run build` + `npm run lint` (baseline 7 problems must not grow).
- Visual check at 360–390px width of each page group (staff shell + one page per module, parent cabinet tabs, a full-screen dialog) and at 1280px to confirm desktop is unchanged; the builder decides the tool (browser devtools via Claude in Chrome if available).

## Settled after the builder check (my calls)

- **Dialogs:** no shared dialog wrapper; each dialog gets `fullScreen={isPhone}` from the shared hook, and its actions stay at the end of its content (reachable by scrolling). Sticky action bars are not required.
- **Card list API:** the shared component takes a per-row render function (arbitrary JSX: inline inputs, checkboxes, expandable parts) plus a small helper for `label: value` lines, so simple tables stay short and complex ones lose nothing.
- **Sorting and filters:** filters above tables already stay; a table with sortable headers gets a sort select above its cards on phones.
- **Editing on phones works everywhere**, not view-only: the register month grid becomes a card per child with tappable mark chips (≥ 40px), the timetable editor a card per day whose entries open the existing dialogs, calendar entries cards with their actions.
- **Reports:** one card per row with every column as `label: value`, even with many columns; totals as a final card; extra sheets as tabs as today.
- **600–900px:** sidebar in the drawer, tables stay tables and scroll horizontally inside their own container (`overflowX: auto`), never the page.
- **Verification:** manual, no new tooling (Playwright etc. would be a new dependency).

## Left to the builder

- The shared card-list component API and the `useIsPhone` hook name.
- Exact fields shown on each card (main identity first, then what the table emphasises).
- How the work is split into tasks (by module is natural).
