# Institutions Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support institutions in the staff app and parent cabinet: switcher with `X-Institution-Id`, institutions page, institution fields in groups, tariffs, calendar, menus, access, reports, parent views.

**Architecture:** A Zustand `institutionStore` holds the chosen institution (persisted in localStorage); the axios request interceptor adds the header; staff layouts remount the page on change. Each module's API client and pages are updated together so every task builds.

**Tech Stack:** React 19, TypeScript 6, Vite 8, MUI 9, Zustand 5, react-hook-form + yup, axios.

**Spec:** `docs/superpowers/specs/2026-10-22-institutions-frontend-design.md` (backend contract: backend `CLAUDE.md` Frontend section and `backend-edu-nest/docs/superpowers/specs/2026-10-22-institutions-design.md`).

## Global Constraints

- Follow this repo's `CLAUDE.md` (FSD structure, API/store/UI conventions, MUI 9 `slotProps`, `import type`, Ukrainian UI text, no comments, named arrow components).
- `axiosInstance` may change only on the request side to add the header; the response/401/refresh logic stays as is (explicit user request).
- Header name `X-Institution-Id`; localStorage key `edunest.institutionId`; every storage access in try/catch.
- Backend routes/bodies exactly as in the spec (menus keep the `/menu-days` prefix; `PUT /menu-days/:date` returns an array).
- New error translations exactly for: `Institution not found`, `Institution name already taken`, `Institution is inactive`, `Institution type cannot change`, `Group is required`, `Tariff belongs to another institution`, `Tariff is in use`, `Child has an active enrollment`, `Child has meal orders`, `Institution is required for institution scope`.
- No new dependencies. No tests exist: each task ends with `npm run build` green and `npx eslint <changed files>` clean (`npm run lint` has a pre-existing error in `EditUserModal.tsx`).
- Commits: Conventional Commits with trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Do not push.

## Review Focus

1. Stored institution no longer granted (access narrowed): after `/auth/me` it is dropped and no request carries the header. Task 1.
2. Parent session never sends the header (parent pages, payment pages). Task 1.
3. Switcher change while a modal is open: the page remounts and the modal closes without stale data. Task 1.
4. Menu save for several institutions: the page shows the current institution's view from the returned array, not the first element. Task 6.
5. Access dialog for a scoped granter offers only their own institutions. Task 7.

---

### Task 1: Switcher, header and translations

**Files:**
- Create: `src/shared/api/institutions.ts` (+ re-export in `shared/api/index.ts`), `src/shared/model/institutionStore.ts`, `src/widgets/header/ui/InstitutionSwitcher.tsx`
- Modify: `src/shared/api/axiosInstance.ts` (request interceptor only), `src/shared/api/auth.ts` / `entities/user/model/types.ts` (profile `institutionIds: string[]`, `accessScope: 'all' | 'institutions'`), `src/widgets/header/ui/Header.tsx`, `src/app/layouts/AdminLayout.tsx` and `RoleLayout.tsx` (Outlet key), `src/entities/user/model/authStore.ts` (reconcile after fetchMe), `src/shared/api/errorMessages.ts`

**Interfaces:**
- `Institution { id: string; name: string; type: 'kindergarten' | 'school_class'; isActive: boolean }`, `institutionTypeLabels` (`Садок`, `Школа`), `institutionsApi = { getList, create, update }` (`GET/POST /institutions`, `PATCH /institutions/:id`), `CreateInstitutionDto { name; type }`, `UpdateInstitutionDto { name?; type?; isActive? }`.
- `useInstitutionStore`: `{ selectedId: string | null; institutions: Institution[]; isLoading; load(): Promise<void>; select(id: string | null): void; reconcile(profile): void }`; `getSelectedInstitutionId()` plain getter for the interceptor.
- Interceptor: adds `X-Institution-Id` when `selectedId` and the current profile is not a parent.

- [ ] Step 1: implement API client, store (persist in localStorage), interceptor, switcher in the header (staff only; single institution → text), Outlet keys, reconcile after `fetchMe` and after `load()`.
- [ ] Step 2: add the translations listed in Global Constraints.
- [ ] Step 3: `npm run build` → green; `npx eslint` on changed files → clean.
- [ ] Step 4: Commit `feat: add institution switcher`.

### Task 2: Institutions page

**Files:**
- Create: `src/pages/institutions/` (`index.ts`, `model/institutionsStore.ts` or reuse `institutionStore` for the list, `ui/InstitutionsPage.tsx`, `ui/CreateInstitutionModal.tsx`, `ui/EditInstitutionModal.tsx`)
- Modify: `src/app/router/index.tsx` (route `/institutions`), `src/widgets/sidebar/model/nav-items.ts` («Заклади», area `settings`)

**Interfaces:** consumes `institutionsApi` (Task 1). Buttons only for root or `settings: edit` with `accessScope === 'all'` (`useCan` + profile). After a mutation, update the shared `institutionStore.institutions` too so the switcher sees it.

- [ ] Step 1: page per the reference module pattern (`pages/children`), modals with yup (name 2..100, type required).
- [ ] Step 2: build + eslint green. Step 3: Commit `feat: add institutions page`.

### Task 3: Groups and children

**Files:**
- Modify: `src/shared/api/groups.ts` (create `institutionId` required, no `kind`; update `institutionId?`, no `kind`; `Group.institution { id, name, type }`), `src/pages/groups/ui/CreateGroupModal.tsx`, `EditGroupModal.tsx`, `GroupsPage.tsx`, children list/card where the group name shows (`src/pages/children/...`, `shared/api/children.ts` types for `group.institution`)

**Interfaces:** consumes `useInstitutionStore().institutions`. Create: active institutions only, default = switcher selection. Edit: institutions of the same type as the current one (active, plus the current).

- [ ] Step 1: implement; remove the kind select; add «Заклад» column; children show `group.institution.name`.
- [ ] Step 2: build + eslint green. Step 3: Commit `feat: groups inside institutions`.

### Task 4: Tariffs

**Files:**
- Modify: `src/shared/api/tariffs.ts` (`institutionId: string | null` in `Tariff`, create/update DTOs), tariff create/edit modals and table under `src/pages/tariffs/`

- [ ] Step 1: «Заклад» select with first option «Спільний для всіх закладів» (`null`); column with «Спільний» for null.
- [ ] Step 2: build + eslint green. Step 3: Commit `feat: tariffs per institution`.

### Task 5: Calendar

**Files:**
- Modify: `src/shared/api/register.ts` (`CalendarScope` + `'institution'`, label «Заклад», `institutionId?` in create DTO, `institution { id, name } | null` in entries), `src/pages/calendar/...` create form and list

- [ ] Step 1: scope «Заклад» shows an institution select (required); list shows the institution name.
- [ ] Step 2: build + eslint green. Step 3: Commit `feat: calendar entries per institution`.

### Task 6: Menus per institution

**Files:**
- Modify: `src/shared/api/meals.ts` (menu functions: `getMenuDays(institutionId, from, to)`, `saveMenuDay(date, institutionIds, dishIds): MenuDayView[]`, `deleteMenuDay(date, institutionId)`, `publish/unpublish({ institutionIds, from, to })`, `copyMenu({ sourceInstitutionId, institutionIds, fromStart, fromEnd, toStart, overwrite })`, `applyTemplate(id, { institutionIds, from, to, startWeek, overwrite })`; `MenuDayView.institutionId`), `src/pages/meals/model/mealsStore.ts`, `src/pages/meals/ui/MenuTab.tsx` and its dialogs

**Interfaces:** current institution = switcher selection, else first active institution; institution selector on the tab replaces the kind selector. Multi-selects default to `[current]`; current cannot be removed in the save dialog.

- [ ] Step 1: implement; after save pick the view whose `institutionId` equals the current institution.
- [ ] Step 2: build + eslint green. Step 3: Commit `feat: menus per institution`.

### Task 7: Staff access by institutions

**Files:**
- Modify: `src/shared/api/access.ts` (`AccessScope = 'all' | 'institutions'`, labels «Усі заклади» / «Вибрані заклади», `institutionIds` in DTO and user types, templates: former kindergarten/school_class templates → `institutions` with `institutionIds: []`), `src/pages/users/ui/AccessDialog.tsx`, users table (show institution names for scoped staff)

**Interfaces:** options limited to the granter's own institutions unless root/`all`; «Вибрані заклади» requires at least one (yup).

- [ ] Step 1: implement. Step 2: build + eslint green. Step 3: Commit `feat: grant access per institution`.

### Task 8: Reports filter and parent cabinet

**Files:**
- Modify: `src/shared/api/reports.ts` (`institutionId?` in query; filter key `'institution'` added to every report definition), `src/pages/reports/ui/ReportFilters.tsx`, `src/pages/reports/model/reportsStore.ts`; `src/shared/api/parentCabinet.ts` (`institution: { id, name } | null` on child views), `src/pages/family/...`, `src/pages/familyChild/...`

- [ ] Step 1: «Заклад» filter (default = switcher selection); parent views show the institution name.
- [ ] Step 2: build + eslint green. Step 3: Commit `feat: institution filter in reports and parent views`.

### Task 9: Docs

**Files:**
- Modify: `CLAUDE.md` (Structure: `pages/institutions`, `shared/model/institutionStore`; a short «Institutions» paragraph: switcher, header, reconcile rule, Outlet key; access dialog scope)

- [ ] Step 1: update; `npm run build` green.
- [ ] Step 2: Commit `docs: describe institutions in CLAUDE.md`.
