# Mobile Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every EduNest screen comfortable on a phone: drawer navigation, card lists instead of tables, full-screen dialogs, single-column forms; desktop unchanged.

**Architecture:** Two shared pieces (`useIsPhone` hook, `CardList` + `CardField` components) and a responsive shell come first; then each module switches its tables to `CardList` below `sm`, makes its dialogs `fullScreen` on phones and wraps its flex rows. Pages keep their current desktop markup untouched for `sm` and up.

**Tech Stack:** React 19, TypeScript 6, MUI 9, Zustand, react-hook-form + yup, Vite.

**Spec:** `docs/superpowers/specs/2026-10-29-mobile-responsive-design.md` (read the "Settled after the builder check" section — it overrides earlier lines).

## Global Constraints

- Repo `D:\IT\EduNest`, branch `main`, commit directly, don't push. Read `CLAUDE.md` first (MUI 9 `slotProps`, `import type`, FSD imports top-down, no new cross-page store imports, don't change `axiosInstance`, `theme.ts`, `RequireAuth`).
- Breakpoints: phone = `theme.breakpoints.down('sm')` (< 600px) → cards, `fullScreen` dialogs, one-column forms. Narrow = `down('md')` (< 900px) → sidebar in a temporary drawer. `md` and up: identical to today.
- No new dependencies. No code comments. No backend changes.
- Every table: phone → `CardList`; `sm`+ → existing table inside a container with `overflowX: 'auto'` (page never scrolls horizontally).
- Every `Dialog`: `fullScreen={isPhone}`; content flex rows use `flexDirection: { xs: 'column', sm: 'row' }` (or `flexWrap: 'wrap'`); action buttons stay at the end of the content.
- Page headers (title + actions): `flexWrap: 'wrap'`, actions full width or icon buttons on phones.
- `Tabs`: `variant="scrollable"` + `allowScrollButtonsMobile` where tabs could overflow 360px.
- Information shown only in a `Tooltip` (void reasons, notes) must appear as a visible line in the card on phones.
- Frequent tap actions (register marks, lesson marks, meal ordering, notice decisions) have a hit area ≥ 40px on phones.
- Verification per task: `npm run build` clean, `npm run lint` ≤ baseline 7 problems (1 error in `EditUserModal.tsx` `useForm<any>`, 6 warnings). Commit trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- A card list that drops a row action present in the table (edit/void/delete/allocate/expand) — each task's reviewer checks action parity table vs card.
- A dialog that stays non-full-screen or keeps a two-column `display: flex` row on phones.
- A grid page (register month, timetable, calendar, reports) that still overflows 360px.
- Desktop regressions: changed markup or spacing at `sm`+ beyond the `overflowX` wrapper.
- Tooltip-only data invisible on phones.

---

### Task 1: Shared pieces and shell

**Files:**
- Create: `src/shared/lib/useIsPhone.ts`, `src/shared/ui/CardList.tsx`
- Modify: `src/app/layouts/AdminLayout.tsx`, `src/app/layouts/ParentLayout.tsx`, `src/app/layouts/RoleLayout.tsx` (only if it renders shell chrome), `src/widgets/sidebar/ui/Sidebar.tsx` (+ its `index.ts` if exports change), `src/widgets/header/ui/Header.tsx`, `src/widgets/header/ui/InstitutionSwitcher.tsx`, `src/shared/ui/ReasonDialog.tsx`, `src/shared/ui/EmptyPage.tsx` (if needed), `CLAUDE.md` (one paragraph "Mobile")

**Interfaces (produced, used by every later task):**
- `useIsPhone(): boolean` — `useMediaQuery(theme.breakpoints.down('sm'))` via `useTheme`.
- `CardList<T>(props: { items: T[]; getKey: (item: T) => string; renderCard: (item: T) => ReactNode; empty?: ReactNode })` — vertical stack of outlined `Card`s (gap 1.5, `CardContent` padding 2), renders `empty` (or nothing) when no items.
- `CardField(props: { label: string; children: ReactNode })` — one `label: value` line (label `text.secondary` body2, value body2, wraps long text).
- `CardActions` usage: plain MUI `CardActions` inside `renderCard` output is fine; `CardList` wraps whatever `renderCard` returns in `<Card variant="outlined"><CardContent>…`, so `renderCard` returns the inner content (title line, fields, chips, an actions row `Box` with `justifyContent: 'flex-end'`).
- Sidebar: `Sidebar` accepts `{ mobileOpen: boolean; onClose: () => void }`; below `md` it renders `Drawer variant="temporary"` (closes on navigation and backdrop), from `md` the current permanent drawer. `AdminLayout` holds the open state; `Header` receives `onMenuClick` and shows a ☰ `IconButton` below `md`; main width `{ xs: '100%', md: calc(100% - 240px) }`; content padding `{ xs: 1.5, sm: 3 }`.

- [ ] **Step 1:** Implement `useIsPhone` and `CardList`/`CardField`.
- [ ] **Step 2:** Responsive shell (sidebar drawer, header menu button, compact header: long names truncate with `noWrap`, institution switcher keeps working at 360px), `ParentLayout` header fits 360px (buttons become icon buttons or a menu on phones; nav still reaches «Моя сім'я», profile, logout).
- [ ] **Step 3:** `ReasonDialog` `fullScreen={isPhone}`.
- [ ] **Step 4:** Add a short "Mobile" paragraph to `CLAUDE.md` (breakpoints, `useIsPhone`, `CardList`/`CardField`, the rules from Global Constraints).
- [ ] **Step 5:** Build + lint; commit `feat: add responsive shell and card list`.

### Task 2: Users, structure and small directories

**Files (pages/widgets):** `pages/users` (UsersPage, AccessDialog, Create/EditUserModal), `pages/positions`, `pages/institutions` (InstitutionBlock, GroupRow, dialogs), `pages/groups`, `pages/children`, `widgets/childForms`, `widgets/groupForms`, `pages/absenceReasons`, `pages/backups`, `pages/subscriptionTypes`, `pages/subscriptions`, `pages/dashboard`, `pages/profile`, `pages/changePassword`, `pages/login`.

- [ ] **Step 1:** Each table → `CardList` on phones with the same row actions; dialogs `fullScreen`; forms one column; headers wrap.
- [ ] **Step 2:** Build + lint; commit `feat: adapt users and structure pages for phones`.

### Task 3: Finance and tariffs

**Files:** `pages/finance` (FinanceBalancesPage, ChildFinancePage and tabs: ChargesTable, PaymentsTable incl. expandable allocations, AllocationTable, HistoryTable, EnrollmentsTab, AdaptationTab, PackagesTab, OnlinePaymentsTab, all 12 dialogs), `pages/tariffs` (TariffsPage, TariffModal incl. price table, CreateTariffModal).

- [ ] **Step 1:** As Task 2; payment cards keep the expand (allocations inside the card) and show void reason as a line; `AllocationTable` inside modals becomes cards with the amount input per card.
- [ ] **Step 2:** Build + lint; commit `feat: adapt finance and tariffs for phones`.

### Task 4: Register, notices, calendar, classes

**Files:** `pages/register` (day register, `RegisterMonthTab` grid → card per child with tappable mark chips ≥ 40px, `MealsTodayBlock`), `pages/absenceNotices`, `pages/calendar`, `pages/classes`, `pages/classGroup` (incl. MarkLessonPage), `pages/myClasses`, `pages/lesson`, `pages/myLessons`.

- [ ] **Step 1:** As Task 2; mark buttons ≥ 40px tap targets on phones; month grid cards keep editing (tap a chip → existing edit flow).
- [ ] **Step 2:** Build + lint; commit `feat: adapt register and classes for phones`.

### Task 5: Timetable and routine

**Files:** `pages/schedule` (TimetableTab grid → card per day, entries open existing dialogs; week view with changes), `pages/scheduleSetup` (NamedTab etc.), `pages/routine`, `widgets/routineDay`.

- [ ] **Step 1:** As Task 2.
- [ ] **Step 2:** Build + lint; commit `feat: adapt timetable and routine for phones`.

### Task 6: Meals

**Files:** `pages/meals` (menu calendar tab, OrdersTab, templates editor, directories: DishTypeBlock, ComplexCard, prices, all 12 dialogs).

- [ ] **Step 1:** As Task 2; menu calendar on phones = card per day.
- [ ] **Step 2:** Build + lint; commit `feat: adapt meals for phones`.

### Task 7: Payroll, audit, reports

**Files:** `pages/payroll` (SheetTab, TermsTab, 9 dialogs), `pages/myPayroll`, `widgets/payrollDetail`, `pages/audit` (EventsTab, LoginsTab, details dialog), `widgets/auditHistory` (ChangesTable, history dialog), `pages/reports` (ReportTable → card per row with every column as `CardField`, totals as a final card; filters wrap).

- [ ] **Step 1:** As Task 2.
- [ ] **Step 2:** Build + lint; commit `feat: adapt payroll, audit and reports for phones`.

### Task 8: Parent cabinet and payment pages

**Files:** `pages/family`, `pages/familyChild` (tabs scrollable; ChildFinanceTab, VisitsTab, AttendanceTab, MealsTab ordering ≥ 40px, RoutineTab, schedule/lessons, PayDialog, PaymentReturnBanner), `pages/pay` (link page, test bank page).

- [ ] **Step 1:** As Task 2; no horizontal scroll anywhere at 360px.
- [ ] **Step 2:** Build + lint; commit `feat: adapt parent cabinet for phones`.

### Task 9: Sweep

- [ ] **Step 1:** `grep -rln "<Table\b" src` and `grep -rln "<Dialog\b" src`: every file uses `useIsPhone` (cards / `fullScreen`) or is justified in the report (e.g. a table that is already a 2-column key/value list and fits 360px).
- [ ] **Step 2:** Fix leftovers; build + lint; commit `fix: finish phone layout sweep` (skip if nothing changed).
