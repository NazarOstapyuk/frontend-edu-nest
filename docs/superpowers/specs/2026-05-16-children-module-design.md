---
title: Children (Учні) Module Design
date: 2026-05-16
status: approved
---

## Overview

Add a fully functional Children (Учні) module to the EduNest frontend. The module allows managing students: viewing the full list, creating, editing, and deleting records.

## Data Model

```ts
interface Child {
  id: string
  firstName: string
  lastName: string
  birthDate: string   // ISO date string, e.g. "2015-09-01"
  group: Group | null
  parents: User[]     // users with role 'parent'
  createdAt: string
}

interface CreateChildDto {
  firstName: string
  lastName: string
  birthDate: string
  groupId: string
  parentIds: string[]
}

interface UpdateChildDto {
  firstName: string
  lastName: string
  birthDate: string
  groupId: string
  parentIds: string[]
}
```

Parents are existing users with role `parent` — the same User entity used across the app. Group is an existing Group entity.

## API Layer — `src/shared/api/children.ts`

```
GET    /children         → Child[]
POST   /children         → Child
PATCH  /children/:id     → Child
DELETE /children/:id     → void
```

Exported from `src/shared/api/index.ts` alongside existing `usersApi`, `groupsApi`.

## Zustand Store — `src/pages/children/model/childrenStore.ts`

State shape (mirrors groupsStore pattern):
- `children: Child[]`
- `isLoading / isCreating / isUpdating / isDeleting: boolean`
- `createChildModal: { isOpen: boolean }`
- `editChildModal: { isOpen: boolean; child: Child | null }`

Actions: `fetchChildren`, `createChild`, `updateChild`, `deleteChild`, `setCreateChildModal`, `setEditChildModal`.

## UI Components

### ChildrenPage — `src/pages/children/ui/ChildrenPage.tsx`

Table layout (matches UsersPage style). Columns:
| # | Ім'я та прізвище | Дата народження | Група | Батьки | Дії |
|---|---|---|---|---|---|

- "Батьки" column renders parent names as Chip components.
- "Група" column renders group name or "—" if none.
- Empty state row spans all columns.
- Header bar: total count (left) + "Створити учня" button (right).

### CreateChildModal — `src/pages/children/ui/CreateChildModal.tsx`

Fields:
- `lastName` — TextField, required, min 2 chars
- `firstName` — TextField, required, min 2 chars
- `birthDate` — TextField type="date", required, with InputLabelProps shrink
- `groupId` — Autocomplete (single), options from groupsStore
- `parentIds` — Autocomplete multiple, options = users filtered by role `parent`

Validation via yup. On submit: calls `createChild`, closes and resets.

### EditChildModal — `src/pages/children/ui/EditChildModal.tsx`

Same fields as Create. Pre-fills from the selected `child` via `useEffect + reset`. On submit: calls `updateChild`.

## Routing

`src/app/router/index.tsx`: replace `EmptyPage` for path `students` with `<ChildrenPage />`.

The sidebar nav item for `/students` already exists in `nav-items.ts`.

## File Summary

| File | Action |
|---|---|
| `src/shared/api/children.ts` | Create |
| `src/shared/api/index.ts` | Update (add children exports) |
| `src/pages/children/model/childrenStore.ts` | Create |
| `src/pages/children/ui/ChildrenPage.tsx` | Create |
| `src/pages/children/ui/CreateChildModal.tsx` | Create |
| `src/pages/children/ui/EditChildModal.tsx` | Create |
| `src/pages/children/index.ts` | Create |
| `src/app/router/index.tsx` | Update |
