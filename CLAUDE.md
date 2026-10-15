# CLAUDE.md

Instructions for Claude Code in this repository. This file is the source of truth for project conventions.

## Project

EduNest: admin panel for an educational institution (users: teachers/parents, groups, children). Frontend only; the backend is a separate REST API with cookie-based auth (`VITE_API_URL`, see `.env.example`).

## Commands

```bash
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build, the main type check
npm run lint     # ESLint
```

There are no tests. Verifying a change = `npm run build` + `npm run lint` with no errors.

## Stack

React 19, TypeScript 6, Vite 8, **MUI 9**, react-router-dom 7, Zustand 5, react-hook-form 7 + yup, axios.

- MUI 9 is newer than most of the model's training data. Before using a prop, check the types in `node_modules/@mui/material/<Component>/<Component>.d.ts`.
- MUI 9: use `slotProps` (`slotProps={{ inputLabel: { shrink: true } }}`), not `InputLabelProps`/`InputProps`.
- `verbatimModuleSyntax`: import types with `import type` / `type X` inside a named import.

## Structure (simplified Feature-Sliced Design)

```
src/
  app/        layouts/AdminLayout, router/index.tsx (all routes), router/RequireAuth.tsx, styles/theme.ts
  pages/<module>/
    index.ts           # export { XPage } from './ui/XPage'
    model/xStore.ts    # Zustand store
    ui/                # XPage.tsx, CreateXModal.tsx, EditXModal.tsx
  entities/user/       # User, UserRole, roleLabels, useAuthStore
  widgets/             # header, sidebar (sidebar/model/nav-items.ts is the menu)
  shared/api/          # axiosInstance + API modules, all re-exported from index.ts
  shared/ui/           # EmptyPage, RHFTextField
docs/superpowers/      # specs/ and plans/
```

Classes and packages: `pages/classes` (Гуртки: directions, class groups, packages), `pages/classGroup` (group page + mark lesson), `pages/myClasses` (teacher view), `shared/model` (notify store). Nav items in `widgets/sidebar/model/nav-items.ts` declare `roles`; items without `roles` are visible to everyone.

Parent cabinet: `pages/family` (children list), `pages/familyChild` (child card and finance), `pages/profile`, `pages/changePassword`. Routing in `app/router/index.tsx`: role gates `RoleGate` and `PasswordGate` (forced password change), `RoleLayout` for routes shared between roles. Session refresh lives in `shared/api/axiosInstance.ts`.

Attendance register: `pages/register` (day register + month grid, staff), `pages/absenceNotices` (admin approval, menu badge via `shared/model/pendingNoticesStore`), `pages/calendar` (working-day calendar + teacher edit window), `pages/absenceReasons`; parent tab «Відвідування» is `pages/familyChild/ui/AttendanceTab.tsx`. API in `shared/api/register.ts`. Day states come from the backend; never compute them on the frontend.

School timetable: `pages/scheduleSetup` (subjects, rooms, bell schedules, subgroups), `pages/schedule` (timetable versions grid + week with cancel/replace/extra changes; 409 `Schedule conflict` lists `conflicts`), `pages/myLessons` and `pages/lesson` (teacher records attendance, topic, homework, НУШ levels; only changed rows are sent), parent tabs «Розклад» and the «Уроки» block in «Відвідування». API in `shared/api/timetable.ts`. Lesson slots and pupil states come from the backend; never compute them on the frontend.

Meals: `pages/meals` (tabs «Меню» calendar by kind with publish/copy/apply template, «Замовлення» day list with portion summary and cancel, «Шаблони» N-week cycle editor, «Довідники» courses, dishes, price categories, complexes with prices and the order deadline), teacher block «Харчування сьогодні» on the register page (`pages/register/ui/MealsTodayBlock.tsx`), parent tab «Харчування» (`pages/familyChild/ui/MealsTab.tsx`). API in `shared/api/meals.ts`. Prices, availability and deadlines come from the backend; never compute them on the frontend (the parent total is display only). Multi-day order errors arrive as `YYYY-MM-DD: <message>`; `translateError` turns them into `DD.MM.YYYY: <переклад>`.

Payroll: `pages/payroll` (tabs «Відомість»: month list of teachers with a detail dialog for worked days, one-off adjustments, payments, approve and reopen; «Умови»: salary terms versions with per-lesson rates and monthly allowances), `pages/myPayroll` (teacher «Моя зарплата», read-only), shared read-only detail `widgets/payrollDetail`. API in `shared/api/payroll.ts`. Amounts, proration and corrections come from the backend; never compute them on the frontend (list totals after a mutation are re-summed in kopecks for display only).

Backups: `pages/backups` (state of database copies, «Зробити копію зараз», files and recent runs; root/admin), dashboard banner `pages/dashboard/ui/BackupBanner.tsx` when copies are not configured or stale. API in `shared/api/backups.ts`. There is no restore in the UI: restore is a backend command (`npm run backup:restore`, see the backend `docs/backups.md`).

Access control: staff permissions come from `GET /auth/me` (`permissions`: area → `view`/`edit`, `accessScope`). Use `useCan(area, level)` / `canAccess(profile, area, level)` from `entities/user` to show navigation items (`NavItem.area`) and hide change buttons on read-only pages; the backend still enforces everything (403 `Insufficient permissions`, 404/403 for records outside the kindergarten/school scope). Access is edited in `pages/users/ui/AccessDialog.tsx` (templates pre-fill the form; options above the current user's own rights are disabled).

Imports go top-down: `app → pages → widgets → entities → shared`. From outside a module, import through its `index.ts`.

Legacy: `pages/children` and `pages/groups` import `pages/users/model/usersStore` and `pages/groups/model/groupsStore` directly. Don't add new cross-page store imports. Data needed by several pages (lists of users, groups, etc.) goes to `entities/<entity>/model/`.

## Conventions

**Reference for new modules: `src/pages/children/` + `src/shared/api/children.ts`.** Copy its patterns, don't invent new ones.

API (`shared/api/<module>.ts`):
- `X`, `CreateXDto`, `UpdateXDto` interfaces live in the same file.
- `xApi = { getList, create, update (PATCH), delete }` via `axiosInstance.<method><T>()`.
- Re-export values and `export type` separately in `shared/api/index.ts`.
- Enum labels: `Record<Enum, string>` (`genderLabels`, `roleLabels`).
- The interceptor rejects with `error.response.data`, not with an `AxiosError`.

Store (`pages/<module>/model/xStore.ts`):
- Flags `isLoading/isCreating/isUpdating/isDeleting`, reset in `finally`. The store doesn't catch errors, it only rethrows them.
- Modal state lives in the store: `createXModal: { isOpen }`, `editXModal: { isOpen, x }` + setters that merge a `Partial`.
- After a mutation, update the list locally (append/map/filter), no refetch.
- In components, one selector per field: `useXStore((s) => s.field)`.

UI:
- Page: counter + "Створити …" button, MUI `Table` inside `Paper elevation={0}` with a border, empty state as a table row; data loaded in `useEffect`.
- Modal: `Dialog fullWidth maxWidth="sm"`, `useForm({ mode: 'all', resolver: yupResolver(schema) })`, type `yup.InferType<typeof schema>`. On close: `reset()` + close via the store.
- Form fields: only `Controller` + an MUI component (`TextField`, `TextField select`, `Autocomplete`) with `error={!!error}` and `helperText={error?.message}`, as in `CreateChildModal`. Don't use `RHFTextField` in new forms (it remains in users/login).
- All UI text and validation messages are in **Ukrainian**.
- Styling via `sx` and theme tokens (`text.secondary`, `divider`, `grey.50`).
- Components: named exports, arrow functions.

### API errors

Server errors are shown centrally: the axios response interceptor (`shared/api/axiosInstance.ts`) pushes a snackbar with `translateError(data)` for every non-401 error and still rejects with `error.response.data`. Translations live in `shared/api/errorMessages.ts` (backend English `message` → Ukrainian; unknown messages and `ValidationPipe` arrays → «Сталася помилка. Спробуйте ще раз.»). When the backend adds a message, add its translation there. Stores and components do not show server errors themselves; they only keep modals open on failure.

Backend error contract (backend repo `backend-edu-nest`, see its CLAUDE.md):
- Body is the NestJS default `{ statusCode, message, error }`, which is what the interceptor rejects with.
- `message` is in **English** (`'Child not found'`, `'Login already taken'`). The backend keeps these strings stable; the frontend maps them to Ukrainian texts in one shared place, not per module.
- For `ValidationPipe` errors (400) `message` is an **array** of English class-validator strings, not a single string.
- If no translation is found, show a generic Ukrainian fallback (e.g. «Сталася помилка. Спробуйте ще раз.»), never the raw English text.
- Don't translate `ValidationPipe` arrays: they are field-specific class-validator strings (`firstName should not be empty`) and mapping them is brittle. Forms already validate with yup, so a 400 with an array `message` gets the generic fallback. Translate only the single-string business messages.
- Translations of all backend business messages live in `shared/api/errorMessages.ts`; add new ones there.

### 401 / session

- `RequireAuth` calls `fetchMe()` once on startup; if there is no profile, it redirects to `/login`.
- An expired session during work (401 on any request) is handled by the interceptor in `shared/api/axiosInstance.ts` (shared in-flight refresh, then retry).
- Backend contract for `POST /auth/login`:
  - Success: `201`, body `{ message: 'Login successful' }`, `accessToken` + `refreshToken` cookies set.
  - Unknown login or wrong password: `401` `{ statusCode: 401, message: 'Invalid credentials', error: 'Unauthorized' }` (show «Невірний логін або пароль»).
  - Inactive user: `401` `{ statusCode: 401, message: 'Account is disabled', error: 'Unauthorized' }`.
  - Empty `login`/`password`: `400` with an array `message` (prevented by yup).
- Backend contract for `POST /auth/refresh` (auth is httpOnly cookies `accessToken` + `refreshToken`):
  - Success: `201`, body `{ message: 'Token refreshed' }`, both cookies replaced (refresh token is rotated, the old one becomes invalid).
  - Missing, invalid, expired or already-rotated refresh cookie, or inactive user: `401` `{ statusCode: 401, message: 'Invalid refresh token', error: 'Unauthorized' }`. Cookies are not cleared. Don't retry refresh on this 401: log out / redirect to `/login`.
  - Any other guarded route with an expired or missing access cookie: `401` `{ statusCode: 401, message: 'Unauthorized' }`.
  - Since the refresh token rotates, concurrent 401s must share one in-flight refresh request.
- Don't run refresh for 401s from `/auth/login`, `/auth/refresh` and `/auth/logout`: a 401 from login is wrong credentials (or a disabled account), from refresh it means log out, from logout the session is already gone (finish logout locally).
- Don't catch 401 in stores or components. There must be a single handler: the interceptor in `shared/api/axiosInstance.ts`.

### Comments

Don't write code comments. Exceptions: lint directives required by the codebase, and a one-line comment only when the code would otherwise look like a bug (a deliberate workaround). Don't delete or rewrite existing comments.

## Roadmap (order matters)

This is the team's plan, not a task list for the agent. Don't start Roadmap items on your own and don't refuse other requests because of it; at most mention once that a requested module will inherit the gaps. Remove items from this list as soon as they are done.

The intent is to close the gap before implementing new modules, so the stub modules don't inherit it:

1. Replace the "API errors" / "401 / session" section above with how to do it now, linking to the reference code.
2. Update `pages/children` to use it, so it is a complete reference again.
3. Move the "New module" checklist into a `new-module` skill.
4. Implement the stubs one by one: `teachers`, `classes`, `schedule`, `grades`, `reports`, `settings`.

## New module checklist

1. `shared/api/<module>.ts` + re-export in `shared/api/index.ts`.
2. `pages/<module>/model/<module>Store.ts`.
3. `pages/<module>/ui/`: `XPage`, `CreateXModal`, `EditXModal`.
4. `pages/<module>/index.ts`.
5. Route in `app/router/index.tsx` (replace the `EmptyPage` stub).
6. Menu item in `widgets/sidebar/model/nav-items.ts`.
7. `npm run build` + `npm run lint`.

## Workflow (superpowers)

For new features and modules:

1. `superpowers:brainstorming` → spec in `docs/superpowers/specs/YYYY-MM-DD-<feature>-design.md`, commit `docs: add <feature> design spec`. Mockups live in `.superpowers/brainstorm/`.
2. `superpowers:writing-plans` → plan in `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`, commit `docs: add <feature> implementation plan`.
3. `superpowers:subagent-driven-development` or `superpowers:executing-plans` → one plan task = one commit.
4. `superpowers:verification-before-completion` → `npm run build` + `npm run lint` before claiming done.

Full cycle example: `docs/superpowers/specs/2026-05-16-children-module-design.md` → `docs/superpowers/plans/2026-05-16-children-module.md`.

Bug fixes and changes touching one or two files: no brainstorming or plan, implement directly + verify.

## Git

- Single branch `main` (remote `origin`). No CI or protected branches yet; add rules here when they appear.
- Don't push without an explicit request.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`), one logical change per commit.

## Rules

- Don't change `axiosInstance`, `theme.ts`, `RequireAuth` without an explicit request. A user request to do Roadmap step 1 is such a request; the Roadmap itself is not.
- Don't add dependencies without approval.
- Don't commit `.env` or secrets; add new env vars to `.env.example` with the `VITE_` prefix.
- Don't touch `README.md` without a request.
