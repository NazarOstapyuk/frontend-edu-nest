# Institutions frontend design

Date: 2026-10-22. Status: approved.

Backend spec: `backend-edu-nest/docs/superpowers/specs/2026-10-22-institutions-design.md` (approved; implemented). The backend `CLAUDE.md` Frontend section lists every API change. This document covers only what the frontend shows and sends.

## Goal

Staff work with several institutions (kindergartens and schools). They pick «Усі заклади» or one institution in a switcher at the top, and every page, report and «Сьогодні» shows only that. Admins create institutions, put groups into them, give tariffs, menus, calendar entries and staff access per institution. Parents see their child's institution.

## Decisions (from brainstorming, carried over)

| Topic | Decision |
|---|---|
| Switcher | One switcher at the top of the staff app: «Усі заклади» or one institution; it filters every page, report and «Сьогодні» |
| Institutions | Admin creates them: name + type (садок / школа); deactivated, never deleted |
| Groups | Created inside an institution; type comes from the institution |
| Children | Group is required (already the case in the form) |
| Tariffs | Per institution or shared («Спільний для всіх закладів») |
| Menus | Per institution; one action can save/copy/publish/apply a template for several institutions |
| Access | All institutions or a chosen list |

## Behaviour

### Switcher (`widgets/header`)
- Visible for every staff role (admin, teacher, root); hidden for parents. Options: «Усі заклади» + institutions from `GET /institutions` (inactive ones marked «(неактивний)»). A user with access to exactly one institution sees it as plain text, no select.
- The choice is kept per browser (`localStorage`, wrapped in try/catch) and in a Zustand store in `shared/model/institutionStore.ts`.
- The axios instance sends header `X-Institution-Id` when an institution is chosen; «Усі заклади» sends nothing. This is the explicit request to change `axiosInstance` (request side only; the 401/refresh logic stays untouched).
- After `GET /auth/me`: if the stored institution is not in `profile.institutionIds` and the user is not root and not scope `all`, drop it. If it is not in the `GET /institutions` list, drop it.
- Changing the switcher remounts the page (`<Outlet key={institutionId ?? 'all'} />` in the staff layouts) so every page reloads its data.

### Institutions page (`pages/institutions`, route `/institutions`, menu item «Заклади»)
- Table: name, type, status; «Створити заклад»; edit modal (name, type, active).
- Visible with permission area `settings` (view). Create/edit buttons only for root or users with `settings: edit` and scope `all`.
- Errors: `Institution name already taken`, `Institution type cannot change`.

### Groups
- Create modal: required «Заклад» select (active institutions only); the «Тип» select is removed (type follows the institution). Edit modal: «Заклад» select limited to institutions of the same type.
- Table gets a «Заклад» column; the type label stays (from `group.kind`).
- Errors: `Institution is inactive`, `Institution type cannot change`, `Child has an active enrollment`, `Child has meal orders`.

### Children
- Create form already requires a group. Lists/cards show the institution name next to the group (`group.institution.name`).
- Moving a child to a group of another institution can answer `Child has an active enrollment` / `Child has meal orders` / `Institution is inactive`.

### Tariffs
- Create/edit: «Заклад» select with first option «Спільний для всіх закладів» (`null`). Table column «Заклад» («Спільний» for null).
- Errors: `Tariff belongs to another institution`, `Tariff is in use`.

### Calendar (`pages/calendar`)
- Scope options gain «Заклад» with an institution select (`institutionId`). Entries show the institution name.
- Error: `Institution is required for institution scope`.

### Meals (`pages/meals`)
- Menu tab: the kind selector becomes an institution selector (defaults to the switcher's institution, else the first active one). `GET /menu-days?institutionId&from&to`.
- Saving a day: dialog adds «Також для закладів» multi-select (current institution always included); `PUT /menu-days/:date` `{ institutionIds, dishIds }` returns an array; the page takes the view of the current institution.
- Delete: `DELETE /menu-days/:date/:institutionId`. Publish/unpublish: `{ institutionIds, from, to }` with a multi-select defaulting to the current institution. Copy: `{ sourceInstitutionId: current, institutionIds, fromStart, fromEnd, toStart, overwrite }`. Template apply: `{ institutionIds, from, to, startWeek, overwrite }`.
- Per-day error prefixes keep working through `translateError`.

### Staff access (`pages/users/ui/AccessDialog.tsx`)
- Scope: «Усі заклади» / «Вибрані заклади» + institution multi-select (required when «Вибрані»). Sends `{ accessScope: 'all' | 'institutions', institutionIds, permissions }`.
- Templates that used `kindergarten`/`school_class` become `institutions` with an empty list the admin fills in. Options above the current user's own scope stay disabled (only their institutions are offered).
- User list shows the institutions of scoped staff.

### Reports
- New «Заклад» filter (institution select) on every report next to «Тип»; sends `institutionId`.

### Parent cabinet
- Family list and child card show the institution name (`institution.name`) when present.

### Errors (`shared/api/errorMessages.ts`)
Add Ukrainian translations for: `Institution not found`, `Institution name already taken`, `Institution is inactive`, `Institution type cannot change`, `Group is required`, `Tariff belongs to another institution`, `Tariff is in use`, `Child has an active enrollment`, `Child has meal orders`, `Institution is required for institution scope`.

## Non-goals
- Per-institution settings, payment requisites, directories.
- Remembering the switcher on the server.

## Left to the builder
- Exact MUI layout of the switcher and dialogs, following existing patterns.
- Store shapes inside the rules above.
