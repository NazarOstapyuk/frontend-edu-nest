# Groups Page Design

**Date:** 2026-05-15  
**Status:** Approved

---

## Overview

Add a Groups page (`/groups`) to the EduNest admin panel. Groups consist of a name and a list of teachers. The page displays groups as cards (not a table), with full CRUD support.

---

## Data Model

```ts
interface Group {
  id: string
  name: string
  teachers: User[]
  createdAt: string
}

interface CreateGroupDto {
  name: string
  teacherIds: string[]
}

interface UpdateGroupDto {
  name: string
  teacherIds: string[]
}
```

---

## File Structure

```
src/
  shared/api/
    groups.ts          — groupsApi (getList, create, update, delete) + DTO types
    index.ts           — add groupsApi export
  pages/groups/
    index.ts           — barrel export
    model/
      groupsStore.ts   — Zustand store (groups, modals state, CRUD actions)
    ui/
      GroupsPage.tsx   — page with header + card grid
      CreateGroupModal.tsx
      EditGroupModal.tsx
  app/router/index.tsx — add /groups route
  widgets/sidebar/model/nav-items.ts — add /groups nav item
```

---

## Page Layout (GroupsPage)

- Header row: `Всього груп: N` (left) + "Створити групу" button (right)
- Below: MUI `Grid` of `Card` components (responsive, e.g. 3 columns on desktop)
- **Each card:**
  - Group name (bold Typography)
  - `Chip` components for each teacher name
  - Edit icon button + Delete icon button (bottom right)
- Empty state: centered text "Груп ще немає. Натисніть «Створити групу»."
- On mount: `fetchGroups()` called via `useEffect`

---

## Modals

### CreateGroupModal
- Form fields:
  - **Назва** — text input, required, min 2 chars
  - **Вчителі** — MUI `Autocomplete` with `multiple`, chips display; options are users with `role === 'teacher'` from `useUsersStore`
- Validation via Yup + React Hook Form
- On submit: calls `createGroup(dto)`, closes modal on success

### EditGroupModal
- Same fields, pre-filled with selected group data
- On submit: calls `updateGroup(id, dto)`, closes modal on success

---

## Store (groupsStore)

```ts
interface GroupsState {
  groups: Group[]
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  createGroupModal: { isOpen: boolean }
  editGroupModal: { isOpen: boolean; group: Group | null }
  setCreateGroupModal: (value) => void
  setEditGroupModal: (value) => void
  fetchGroups: () => Promise<void>
  createGroup: (dto: CreateGroupDto) => Promise<void>
  updateGroup: (id: string, dto: UpdateGroupDto) => Promise<void>
  deleteGroup: (id: string) => Promise<void>
}
```

---

## API (shared/api/groups.ts)

```ts
groupsApi.getList()           → GET  /groups
groupsApi.create(dto)         → POST /groups
groupsApi.update(id, dto)     → PATCH /groups/:id
groupsApi.delete(id)          → DELETE /groups/:id
```

---

## Routing & Navigation

- Route: `{ path: 'groups', element: <GroupsPage /> }` added to router
- Nav item: `{ path: '/groups', label: 'Групи', icon: GroupsIcon }` added to `nav-items.ts`

---

## Dependencies

- Teachers list is loaded from `useUsersStore` (already exists) — filtered to `role === 'teacher'`
- `fetchUsers()` called in `GroupsPage` on mount to ensure teachers are available for autocomplete
