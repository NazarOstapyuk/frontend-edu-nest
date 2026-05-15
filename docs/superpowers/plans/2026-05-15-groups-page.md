# Groups Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully functional Groups page (`/groups`) with card grid display, create/edit modals, and full CRUD via API.

**Architecture:** Mirror the existing Users page pattern — `shared/api/groups.ts` for API calls, `pages/groups/model/groupsStore.ts` (Zustand) for state, and three UI components in `pages/groups/ui/`. Teachers list is sourced from the existing `useUsersStore`.

**Tech Stack:** React 19, TypeScript, MUI v9, Zustand v5, React Hook Form v7, Yup, Axios, React Router v7.

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/shared/api/groups.ts` |
| Modify | `src/shared/api/index.ts` |
| Create | `src/pages/groups/model/groupsStore.ts` |
| Create | `src/pages/groups/ui/GroupsPage.tsx` |
| Create | `src/pages/groups/ui/CreateGroupModal.tsx` |
| Create | `src/pages/groups/ui/EditGroupModal.tsx` |
| Create | `src/pages/groups/index.ts` |
| Modify | `src/app/router/index.tsx` |
| Modify | `src/widgets/sidebar/model/nav-items.ts` |

---

## Task 1: Group types and API layer

**Files:**
- Create: `src/shared/api/groups.ts`
- Modify: `src/shared/api/index.ts`

- [ ] **Step 1: Create `src/shared/api/groups.ts`**

```ts
import type { User } from '../../entities/user';
import { axiosInstance } from './axiosInstance';

export interface Group {
  id: string;
  name: string;
  teachers: User[];
  createdAt: string;
}

export interface CreateGroupDto {
  name: string;
  teacherIds: string[];
}

export interface UpdateGroupDto {
  name: string;
  teacherIds: string[];
}

export const groupsApi = {
  getList: () =>
    axiosInstance.get<Group[]>('/groups'),

  create: (dto: CreateGroupDto) =>
    axiosInstance.post<Group>('/groups', dto),

  update: (id: string, dto: UpdateGroupDto) =>
    axiosInstance.patch<Group>(`/groups/${id}`, dto),

  delete: (id: string) =>
    axiosInstance.delete(`/groups/${id}`),
};
```

- [ ] **Step 2: Update `src/shared/api/index.ts` — add groups exports**

Replace the file content with:

```ts
export { axiosInstance } from './axiosInstance';
export { authApi } from './auth';
export { usersApi } from './users';
export type { CreateUserDto, UpdateUserDto } from './users';
export { groupsApi } from './groups';
export type { Group, CreateGroupDto, UpdateGroupDto } from './groups';
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/shared/api/groups.ts src/shared/api/index.ts
git commit -m "feat: add groups API layer and Group types"
```

---

## Task 2: Groups Zustand store

**Files:**
- Create: `src/pages/groups/model/groupsStore.ts`

- [ ] **Step 1: Create directory and store file**

Create `src/pages/groups/model/groupsStore.ts`:

```ts
import { create } from 'zustand';
import { groupsApi, type CreateGroupDto, type UpdateGroupDto, type Group } from '../../../shared/api';

interface GroupsState {
  groups: Group[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  createGroupModal: { isOpen: boolean };
  editGroupModal: { isOpen: boolean; group: Group | null };
  setCreateGroupModal: (value: Partial<{ isOpen: boolean }>) => void;
  setEditGroupModal: (value: Partial<{ isOpen: boolean; group: Group | null }>) => void;
  fetchGroups: () => Promise<void>;
  createGroup: (dto: CreateGroupDto) => Promise<void>;
  updateGroup: (id: string, dto: UpdateGroupDto) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
}

export const useGroupsStore = create<GroupsState>((set) => ({
  groups: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  createGroupModal: { isOpen: false },
  editGroupModal: { isOpen: false, group: null },

  setCreateGroupModal: (value) =>
    set((state) => ({ createGroupModal: { ...state.createGroupModal, ...value } })),

  setEditGroupModal: (value) =>
    set((state) => ({ editGroupModal: { ...state.editGroupModal, ...value } })),

  fetchGroups: async () => {
    set({ isLoading: true });
    try {
      const { data } = await groupsApi.getList();
      set({ groups: data });
    } finally {
      set({ isLoading: false });
    }
  },

  createGroup: async (dto) => {
    set({ isCreating: true });
    try {
      const { data } = await groupsApi.create(dto);
      set((state) => ({ groups: [...state.groups, data] }));
    } finally {
      set({ isCreating: false });
    }
  },

  updateGroup: async (id, dto) => {
    set({ isUpdating: true });
    try {
      const { data } = await groupsApi.update(id, dto);
      set((state) => ({
        groups: state.groups.map((g) => (g.id === id ? data : g)),
      }));
    } finally {
      set({ isUpdating: false });
    }
  },

  deleteGroup: async (id) => {
    set({ isDeleting: true });
    try {
      await groupsApi.delete(id);
      set((state) => ({ groups: state.groups.filter((g) => g.id !== id) }));
    } finally {
      set({ isDeleting: false });
    }
  },
}));
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/groups/model/groupsStore.ts
git commit -m "feat: add groups Zustand store"
```

---

## Task 3: GroupsPage — card grid

**Files:**
- Create: `src/pages/groups/ui/GroupsPage.tsx`
- Create: `src/pages/groups/index.ts`

- [ ] **Step 1: Create `src/pages/groups/ui/GroupsPage.tsx`**

```tsx
import { useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useGroupsStore } from '../model/groupsStore'
import { useUsersStore } from '../../users/model/usersStore'
import { CreateGroupModal } from './CreateGroupModal'
import { EditGroupModal } from './EditGroupModal'

export const GroupsPage = () => {
  const groups = useGroupsStore((s) => s.groups)
  const fetchGroups = useGroupsStore((s) => s.fetchGroups)
  const setCreateGroupModal = useGroupsStore((s) => s.setCreateGroupModal)
  const setEditGroupModal = useGroupsStore((s) => s.setEditGroupModal)
  const deleteGroup = useGroupsStore((s) => s.deleteGroup)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)

  useEffect(() => {
    fetchGroups()
    fetchUsers()
  }, [fetchGroups, fetchUsers])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Всього груп: {groups.length}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateGroupModal({ isOpen: true })}
        >
          Створити групу
        </Button>
      </Box>

      {groups.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          Груп ще немає. Натисніть «Створити групу».
        </Box>
      ) : (
        <Grid container spacing={2}>
          {groups.map((group) => (
            <Grid key={group.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {group.name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {group.teachers.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Вчителів немає
                      </Typography>
                    ) : (
                      group.teachers.map((teacher) => (
                        <Chip
                          key={teacher.id}
                          label={`${teacher.lastName} ${teacher.firstName}`}
                          size="small"
                          variant="outlined"
                        />
                      ))
                    )}
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                  <Tooltip title="Редагувати">
                    <IconButton
                      size="small"
                      onClick={() => setEditGroupModal({ isOpen: true, group })}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Видалити">
                    <IconButton size="small" color="error" onClick={() => deleteGroup(group.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <CreateGroupModal />
      <EditGroupModal />
    </Box>
  )
}
```

- [ ] **Step 2: Create `src/pages/groups/index.ts`**

```ts
export { GroupsPage } from './ui/GroupsPage'
```

- [ ] **Step 3: Verify TypeScript compiles** (modals not yet created — expect errors only for missing modal imports, skip if so)

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/pages/groups/ui/GroupsPage.tsx src/pages/groups/index.ts
git commit -m "feat: add GroupsPage with card grid layout"
```

---

## Task 4: CreateGroupModal

**Files:**
- Create: `src/pages/groups/ui/CreateGroupModal.tsx`

- [ ] **Step 1: Create `src/pages/groups/ui/CreateGroupModal.tsx`**

```tsx
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogTitle,
  TextField,
} from '@mui/material'
import { useGroupsStore } from '../model/groupsStore'
import { useUsersStore } from '../../users/model/usersStore'

const schema = yup.object({
  name: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  teacherIds: yup.array().of(yup.string().required()).default([]),
})

type FormValues = yup.InferType<typeof schema>

export const CreateGroupModal = () => {
  const createGroup = useGroupsStore((s) => s.createGroup)
  const isCreating = useGroupsStore((s) => s.isCreating)
  const { isOpen } = useGroupsStore((s) => s.createGroupModal)
  const setCreateGroupModal = useGroupsStore((s) => s.setCreateGroupModal)
  const users = useUsersStore((s) => s.users)

  const teachers = users.filter((u) => u.role === 'teacher')

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', teacherIds: [] },
    resolver: yupResolver(schema),
  })

  const handleClose = () => {
    reset()
    setCreateGroupModal({ isOpen: false })
  }

  const onSubmit = async (values: FormValues) => {
    await createGroup({ name: values.name, teacherIds: values.teacherIds ?? [] })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Нова група</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Назва"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="teacherIds"
          control={control}
          render={({ field }) => (
            <Autocomplete
              multiple
              options={teachers}
              getOptionLabel={(option) => `${option.lastName} ${option.firstName}`}
              value={teachers.filter((t) => field.value?.includes(t.id))}
              onChange={(_, selected) => field.onChange(selected.map((t) => t.id))}
              renderInput={(params) => <TextField {...params} label="Вчителі" />}
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isCreating}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors (EditGroupModal still missing — only that import will fail)

- [ ] **Step 3: Commit**

```bash
git add src/pages/groups/ui/CreateGroupModal.tsx
git commit -m "feat: add CreateGroupModal"
```

---

## Task 5: EditGroupModal

**Files:**
- Create: `src/pages/groups/ui/EditGroupModal.tsx`

- [ ] **Step 1: Create `src/pages/groups/ui/EditGroupModal.tsx`**

```tsx
import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogTitle,
  TextField,
} from '@mui/material'
import { useGroupsStore } from '../model/groupsStore'
import { useUsersStore } from '../../users/model/usersStore'

const schema = yup.object({
  name: yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле"),
  teacherIds: yup.array().of(yup.string().required()).default([]),
})

type FormValues = yup.InferType<typeof schema>

export const EditGroupModal = () => {
  const updateGroup = useGroupsStore((s) => s.updateGroup)
  const isUpdating = useGroupsStore((s) => s.isUpdating)
  const { isOpen, group } = useGroupsStore((s) => s.editGroupModal)
  const setEditGroupModal = useGroupsStore((s) => s.setEditGroupModal)
  const users = useUsersStore((s) => s.users)

  const teachers = users.filter((u) => u.role === 'teacher')

  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { name: '', teacherIds: [] },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (group) {
      reset({
        name: group.name,
        teacherIds: group.teachers.map((t) => t.id),
      })
    }
  }, [group, reset])

  const handleClose = () => {
    reset()
    setEditGroupModal({ isOpen: false, group: null })
  }

  const onSubmit = async (values: FormValues) => {
    if (!group) return
    await updateGroup(group.id, { name: values.name, teacherIds: values.teacherIds ?? [] })
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Редагувати групу</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: '20px' }}>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Назва"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="teacherIds"
          control={control}
          render={({ field }) => (
            <Autocomplete
              multiple
              options={teachers}
              getOptionLabel={(option) => `${option.lastName} ${option.firstName}`}
              value={teachers.filter((t) => field.value?.includes(t.id))}
              onChange={(_, selected) => field.onChange(selected.map((t) => t.id))}
              renderInput={(params) => <TextField {...params} label="Вчителі" />}
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isUpdating}
            sx={{ width: '100%' }}
          >
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles — all errors should now be gone**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/groups/ui/EditGroupModal.tsx
git commit -m "feat: add EditGroupModal"
```

---

## Task 6: Wire up routing and navigation

**Files:**
- Modify: `src/app/router/index.tsx`
- Modify: `src/widgets/sidebar/model/nav-items.ts`

- [ ] **Step 1: Update `src/app/router/index.tsx` — add `/groups` route**

Add import at the top (after existing page imports):

```tsx
import { GroupsPage } from '../../pages/groups'
```

Add route inside the `AdminLayout` children array, after the `users` route:

```tsx
{ path: 'groups', element: <GroupsPage /> },
```

Full updated file for reference:

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { RequireAuth } from './RequireAuth'
import { DashboardPage } from '../../pages/dashboard'
import { UsersPage } from '../../pages/users'
import { GroupsPage } from '../../pages/groups'
import { EmptyPage } from '../../shared/ui/EmptyPage'
import { LoginPage } from '../../pages/login'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true,       element: <DashboardPage /> },
          { path: 'users',     element: <UsersPage /> },
          { path: 'groups',    element: <GroupsPage /> },
          { path: 'students',  element: <EmptyPage title="Учні" /> },
          { path: 'teachers',  element: <EmptyPage title="Вчителі" /> },
          { path: 'classes',   element: <EmptyPage title="Класи" /> },
          { path: 'schedule',  element: <EmptyPage title="Розклад" /> },
          { path: 'grades',    element: <EmptyPage title="Оцінки" /> },
          { path: 'reports',   element: <EmptyPage title="Звіти" /> },
          { path: 'settings',  element: <EmptyPage title="Налаштування" /> },
          { path: '*',         element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
```

- [ ] **Step 2: Update `src/widgets/sidebar/model/nav-items.ts` — add Groups nav item**

Add import at the top:

```ts
import GroupsIcon from '@mui/icons-material/Groups'
```

Add to `navItems` array after the `/users` entry:

```ts
{ path: '/groups', label: 'Групи', icon: GroupsIcon },
```

Full updated `navItems` array:

```ts
export const navItems: NavItem[] = [
  { path: '/',          label: 'Дашборд',     icon: DashboardIcon },
  { path: '/users',     label: 'Користувачі', icon: ManageAccountsIcon },
  { path: '/groups',    label: 'Групи',       icon: GroupsIcon },
  { path: '/students',  label: 'Учні',        icon: PeopleIcon },
  { path: '/teachers',  label: 'Вчителі',     icon: SchoolIcon },
  { path: '/classes',   label: 'Класи',       icon: ClassIcon },
  { path: '/schedule',  label: 'Розклад',     icon: CalendarMonthIcon },
  { path: '/grades',    label: 'Оцінки',      icon: AssignmentIcon },
  { path: '/reports',   label: 'Звіти',       icon: BarChartIcon },
]
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Run dev server and verify visually**

Run: `npm run dev`

Check:
- "Групи" nav item appears in sidebar
- Navigating to `/groups` shows the page with "Всього груп: 0" and "Створити групу" button
- Empty state text is visible
- "Створити групу" opens the modal with Назва field and Вчителі autocomplete
- Edit icon on a card opens EditGroupModal pre-filled with group data
- Delete icon removes the card

- [ ] **Step 5: Commit**

```bash
git add src/app/router/index.tsx src/widgets/sidebar/model/nav-items.ts
git commit -m "feat: wire up /groups route and sidebar nav item"
```
