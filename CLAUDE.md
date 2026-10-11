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

In children, server errors are currently not shown to the user: `await createChild(...)` throws, `handleClose()` is not called, the modal stays open. There is no shared mechanism yet (see Roadmap). Don't invent per-module error display.

Backend error contract (backend repo `backend-edu-nest`, see its CLAUDE.md):
- Body is the NestJS default `{ statusCode, message, error }`, which is what the interceptor rejects with.
- `message` is in **English** (`'Child not found'`, `'Login already taken'`). The backend keeps these strings stable; the frontend maps them to Ukrainian texts in one shared place, not per module.
- For `ValidationPipe` errors (400) `message` is an **array** of English class-validator strings, not a single string.
- If no translation is found, show a generic Ukrainian fallback (e.g. «Сталася помилка. Спробуйте ще раз.»), never the raw English text.
- Don't translate `ValidationPipe` arrays: they are field-specific class-validator strings (`firstName should not be empty`) and mapping them is brittle. Forms already validate with yup, so a 400 with an array `message` gets the generic fallback. Translate only the single-string business messages.
- Finance messages to translate when the shared error display (Roadmap step 1) is built: `Charge not found`, `Payment not found`, `Allocation not found`, `Charge is voided`, `Payment is voided`, `Allocation is voided`, `Payment is not confirmed`, `Charge belongs to another child`, `Charge category does not match payment category`, `Allocation exceeds payment free amount`, `Allocation exceeds charge remaining amount`, `Amount must be greater than 0`, `Duplicate charge in allocations`, `Period end must not be before period start`, `Cannot delete: child has financial records`, `Cannot delete: user has financial records, deactivate instead`.

### 401 / session

- `RequireAuth` calls `fetchMe()` once on startup; if there is no profile, it redirects to `/login`.
- An expired session during work (401 on any request) is currently not handled; `authApi.refresh` exists but is never called (see Roadmap).
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

The intent is to close the two gaps before implementing new modules, so the stub modules don't inherit them:

1. **Shared error display**: snackbar for general errors + `setError` for field errors. Full superpowers cycle.
2. **Refresh / logout in the interceptor** (`shared/api/axiosInstance.ts`).
3. After each step, replace the "API errors" / "401 / session" section above with how to do it now, linking to the reference code.
4. Update `pages/children` to use both, so it is a complete reference again.
5. Move the "New module" checklist into a `new-module` skill.
6. Implement the stubs one by one: `teachers`, `classes`, `schedule`, `grades`, `reports`, `settings`.

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

- Don't change `axiosInstance`, `theme.ts`, `RequireAuth` without an explicit request. A user request to do Roadmap step 1 or 2 is such a request; the Roadmap itself is not.
- Don't add dependencies without approval.
- Don't commit `.env` or secrets; add new env vars to `.env.example` with the `VITE_` prefix.
- Don't touch `README.md` without a request.
